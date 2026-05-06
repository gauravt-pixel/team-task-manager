from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, get_project_member, require_admin

router = APIRouter()


@router.post("/projects/{project_id}/tasks", response_model=schemas.TaskOut, status_code=201)
def create_task(
    project_id: int,
    payload: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    get_project_member(project_id, current_user, db)

    if payload.assignee_id:
        assignee_member = (
            db.query(models.ProjectMember)
            .filter(
                models.ProjectMember.project_id == project_id,
                models.ProjectMember.user_id == payload.assignee_id,
            )
            .first()
        )
        if not assignee_member:
            raise HTTPException(status_code=400, detail="Assignee is not a project member")

    task = models.Task(
        **payload.model_dump(exclude_none=True),
        project_id=project_id,
        creator_id=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    return (
        db.query(models.Task)
        .options(joinedload(models.Task.assignee), joinedload(models.Task.creator))
        .filter(models.Task.id == task.id)
        .first()
    )


@router.get("/projects/{project_id}/tasks", response_model=List[schemas.TaskOut])
def list_tasks(
    project_id: int,
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    assignee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    get_project_member(project_id, current_user, db)
    query = (
        db.query(models.Task)
        .options(joinedload(models.Task.assignee), joinedload(models.Task.creator))
        .filter(models.Task.project_id == project_id)
    )
    if status:
        query = query.filter(models.Task.status == status)
    if priority:
        query = query.filter(models.Task.priority == priority)
    if assignee_id:
        query = query.filter(models.Task.assignee_id == assignee_id)
    return query.order_by(models.Task.created_at.desc()).all()


@router.get("/my-tasks", response_model=List[schemas.TaskOut])
def my_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    memberships = (
        db.query(models.ProjectMember)
        .filter(models.ProjectMember.user_id == current_user.id)
        .all()
    )
    project_ids = [m.project_id for m in memberships]
    return (
        db.query(models.Task)
        .options(joinedload(models.Task.assignee), joinedload(models.Task.creator))
        .filter(
            models.Task.assignee_id == current_user.id,
            models.Task.project_id.in_(project_ids),
        )
        .order_by(models.Task.due_date.asc().nullslast(), models.Task.created_at.desc())
        .all()
    )


@router.get("/projects/{project_id}/tasks/{task_id}", response_model=schemas.TaskOut)
def get_task(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    get_project_member(project_id, current_user, db)
    task = (
        db.query(models.Task)
        .options(joinedload(models.Task.assignee), joinedload(models.Task.creator))
        .filter(models.Task.id == task_id, models.Task.project_id == project_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/projects/{project_id}/tasks/{task_id}", response_model=schemas.TaskOut)
def update_task(
    project_id: int,
    task_id: int,
    payload: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    member = get_project_member(project_id, current_user, db)
    task = (
        db.query(models.Task)
        .filter(models.Task.id == task_id, models.Task.project_id == project_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # members can only update their own tasks unless admin
    if member.role != models.RoleEnum.admin and task.creator_id != current_user.id and task.assignee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot update this task")

    if payload.assignee_id is not None:
        assignee_member = (
            db.query(models.ProjectMember)
            .filter(
                models.ProjectMember.project_id == project_id,
                models.ProjectMember.user_id == payload.assignee_id,
            )
            .first()
        )
        if not assignee_member:
            raise HTTPException(status_code=400, detail="Assignee is not a project member")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()

    return (
        db.query(models.Task)
        .options(joinedload(models.Task.assignee), joinedload(models.Task.creator))
        .filter(models.Task.id == task_id)
        .first()
    )


@router.delete("/projects/{project_id}/tasks/{task_id}", status_code=204)
def delete_task(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    member = get_project_member(project_id, current_user, db)
    task = (
        db.query(models.Task)
        .filter(models.Task.id == task_id, models.Task.project_id == project_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if member.role != models.RoleEnum.admin and task.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot delete this task")
    db.delete(task)
    db.commit()

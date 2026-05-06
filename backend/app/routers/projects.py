from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, get_project_member, require_admin

router = APIRouter()


def enrich_project(project: models.Project) -> dict:
    data = {c.name: getattr(project, c.name) for c in project.__table__.columns}
    data["members"] = project.members
    data["task_count"] = len(project.tasks)
    data["completed_task_count"] = sum(1 for t in project.tasks if t.status == models.TaskStatusEnum.done)
    return data


@router.post("/", response_model=schemas.ProjectOut, status_code=201)
def create_project(
    payload: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = models.Project(
        **payload.model_dump(exclude_none=True),
        creator_id=current_user.id,
    )
    db.add(project)
    db.flush()

    membership = models.ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role=models.RoleEnum.admin,
    )
    db.add(membership)
    db.commit()
    db.refresh(project)
    return enrich_project(project)


@router.get("/", response_model=List[schemas.ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    memberships = (
        db.query(models.ProjectMember)
        .filter(models.ProjectMember.user_id == current_user.id)
        .all()
    )
    project_ids = [m.project_id for m in memberships]
    projects = (
        db.query(models.Project)
        .options(
            joinedload(models.Project.members).joinedload(models.ProjectMember.user),
            joinedload(models.Project.tasks),
        )
        .filter(models.Project.id.in_(project_ids))
        .all()
    )
    return [enrich_project(p) for p in projects]


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    get_project_member(project_id, current_user, db)
    project = (
        db.query(models.Project)
        .options(
            joinedload(models.Project.members).joinedload(models.ProjectMember.user),
            joinedload(models.Project.tasks),
        )
        .filter(models.Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return enrich_project(project)


@router.patch("/{project_id}", response_model=schemas.ProjectOut)
def update_project(
    project_id: int,
    payload: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_admin(project_id, current_user, db)
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return enrich_project(project)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_admin(project_id, current_user, db)
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()


@router.post("/{project_id}/members", response_model=schemas.ProjectMemberOut, status_code=201)
def add_member(
    project_id: int,
    payload: schemas.AddMember,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_admin(project_id, current_user, db)
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")

    existing = (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.project_id == project_id,
            models.ProjectMember.user_id == user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")

    member = models.ProjectMember(project_id=project_id, user_id=user.id, role=payload.role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.patch("/{project_id}/members/{member_id}", response_model=schemas.ProjectMemberOut)
def update_member_role(
    project_id: int,
    member_id: int,
    payload: schemas.UpdateMemberRole,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_admin(project_id, current_user, db)
    member = (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.id == member_id,
            models.ProjectMember.project_id == project_id,
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if member.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    member.role = payload.role
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{project_id}/members/{member_id}", status_code=204)
def remove_member(
    project_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_admin(project_id, current_user, db)
    member = (
        db.query(models.ProjectMember)
        .filter(
            models.ProjectMember.id == member_id,
            models.ProjectMember.project_id == project_id,
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if member.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")
    db.delete(member)
    db.commit()

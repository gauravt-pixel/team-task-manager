from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter()


@router.get("/stats", response_model=schemas.DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    memberships = (
        db.query(models.ProjectMember)
        .filter(models.ProjectMember.user_id == current_user.id)
        .all()
    )
    project_ids = [m.project_id for m in memberships]

    projects = db.query(models.Project).filter(models.Project.id.in_(project_ids)).all()
    total_projects = len(projects)
    active_projects = sum(1 for p in projects if p.is_active)

    tasks = (
        db.query(models.Task)
        .filter(models.Task.project_id.in_(project_ids))
        .all()
    )
    now = datetime.now(timezone.utc)
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == models.TaskStatusEnum.done)
    in_progress_tasks = sum(1 for t in tasks if t.status == models.TaskStatusEnum.in_progress)
    overdue_tasks = sum(
        1 for t in tasks
        if t.due_date and t.due_date.replace(tzinfo=timezone.utc) < now and t.status != models.TaskStatusEnum.done
    )
    my_tasks = sum(1 for t in tasks if t.assignee_id == current_user.id)
    completion_rate = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)

    return schemas.DashboardStats(
        total_projects=total_projects,
        active_projects=active_projects,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        overdue_tasks=overdue_tasks,
        in_progress_tasks=in_progress_tasks,
        my_tasks=my_tasks,
        completion_rate=completion_rate,
    )


@router.get("/recent-tasks")
def recent_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    from sqlalchemy.orm import joinedload
    memberships = (
        db.query(models.ProjectMember)
        .filter(models.ProjectMember.user_id == current_user.id)
        .all()
    )
    project_ids = [m.project_id for m in memberships]
    tasks = (
        db.query(models.Task)
        .options(
            joinedload(models.Task.assignee),
            joinedload(models.Task.project),
        )
        .filter(models.Task.project_id.in_(project_ids))
        .order_by(models.Task.updated_at.desc().nullslast(), models.Task.created_at.desc())
        .limit(10)
        .all()
    )
    result = []
    for t in tasks:
        result.append({
            "id": t.id,
            "title": t.title,
            "status": t.status,
            "priority": t.priority,
            "project_name": t.project.name if t.project else "",
            "project_id": t.project_id,
            "assignee": {"name": t.assignee.name, "avatar_color": t.assignee.avatar_color} if t.assignee else None,
            "due_date": t.due_date,
        })
    return result

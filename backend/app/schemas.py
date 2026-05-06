from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from app.models import RoleEnum, TaskStatusEnum, TaskPriorityEnum


# ─── Auth ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"


# ─── Users ───────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool
    avatar_color: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_color: Optional[str] = None


# ─── Projects ────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#6366f1"
    due_date: Optional[datetime] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Project name cannot be empty")
        return v.strip()


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    due_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class ProjectMemberOut(BaseModel):
    id: int
    user_id: int
    role: RoleEnum
    joined_at: datetime
    user: UserOut

    class Config:
        from_attributes = True


class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    color: str
    is_active: bool
    creator_id: int
    due_date: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    members: List[ProjectMemberOut] = []
    task_count: Optional[int] = 0
    completed_task_count: Optional[int] = 0

    class Config:
        from_attributes = True


class AddMember(BaseModel):
    email: str
    role: RoleEnum = RoleEnum.member


class UpdateMemberRole(BaseModel):
    role: RoleEnum


# ─── Tasks ───────────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatusEnum = TaskStatusEnum.todo
    priority: TaskPriorityEnum = TaskPriorityEnum.medium
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None
    tags: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Task title cannot be empty")
        return v.strip()


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatusEnum] = None
    priority: Optional[TaskPriorityEnum] = None
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None
    tags: Optional[str] = None


class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: TaskStatusEnum
    priority: TaskPriorityEnum
    project_id: int
    assignee_id: Optional[int]
    creator_id: int
    due_date: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    tags: Optional[str]
    assignee: Optional[UserOut] = None
    creator: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ─── Dashboard ───────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_projects: int
    active_projects: int
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int
    in_progress_tasks: int
    my_tasks: int
    completion_rate: float


Token.model_rebuild()

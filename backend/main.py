from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from app.database import engine, Base
from app.routers import auth, users, projects, tasks, dashboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up — creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully.")
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")
        raise
    yield
    logger.info("Shutting down.")

app = FastAPI(
    title="Team Task Manager API",
    description="Full-stack team project & task management with role-based access",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Team Task Manager API is running 🚀"}

@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}

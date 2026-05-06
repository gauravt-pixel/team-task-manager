from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Railway gives DATABASE_URL starting with postgres:// but SQLAlchemy needs postgresql://
def fix_db_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url

db_url = fix_db_url(settings.DATABASE_URL)

# Add SSL for Railway PostgreSQL
engine = create_engine(
    db_url,
    connect_args={"sslmode": "require"} if "railway" in db_url or "amazonaws" in db_url else {},
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

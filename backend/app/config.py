from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/taskmanager"
    SECRET_KEY: str = "changeme-use-a-real-secret-in-production-env"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    PORT: Optional[int] = 8000

    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()

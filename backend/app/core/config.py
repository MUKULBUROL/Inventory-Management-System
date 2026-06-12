from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

# Load environment variables from .env file (looks in current dir and parent dirs)
load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "Inventory & Order Management System"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database configuration
    # Default to docker-compose service name 'db'
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "db")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "inventory")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )
    
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    
    # Connection pool configuration
    SQLALCHEMY_POOL_SIZE: int = int(os.getenv("SQLALCHEMY_POOL_SIZE", "100"))
    SQLALCHEMY_MAX_OVERFLOW: int = int(os.getenv("SQLALCHEMY_MAX_OVERFLOW", "150"))

    # CORS Allowed Origins
    # Add localhost:3000, localhost:5173 (Vite default) and wildcard for flexibility
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
    ]

    class Config:
        case_sensitive = True

settings = Settings()

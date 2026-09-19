import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore"
    )

    PROJECT_NAME: str = "LandStack Backend API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DESCRIPTION: str = (
        "LandStack Central Connection Layer (Member 2) connecting GIS, Land Records, "
        "AI Agents, and Frontend through unified REST APIs."
    )
    
    # Database configuration (Defaults to SQLite for zero-setup, supports PostgreSQL / Supabase)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./landstack.db")
    
    # Supabase metadata
    SUPABASE_PROJECT_ID: Optional[str] = "slrjtctvyhhbwwcgomcy"
    SUPABASE_URL: Optional[str] = "https://slrjtctvyhhbwwcgomcy.supabase.co"

    # JWT & Security Configuration
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "landstack-super-secret-key-change-in-production-2025")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]
    
    # Demonstration auto-seed toggle
    AUTO_SEED_DATABASE: bool = True

settings = Settings()

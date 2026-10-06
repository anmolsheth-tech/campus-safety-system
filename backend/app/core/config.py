from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    DATABASE_URL: str = "sqlite:///./campus_safety.db"
    SECRET_KEY: str = "dev-secret-key-change-in-production-min-32-chars-long!!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    DEMO_MODE: bool = True
    VITE_API_URL: str = "http://localhost:8000/api"

    RISK_INCIDENT_RADIUS_METERS: float = 200.0
    RISK_DECAY_HOURS: float = 6.0


settings = Settings()

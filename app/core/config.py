import os
from typing import Annotated, List, Literal, Optional
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

DEV_SECRET_KEY = "dev-only-secret-key-change-me-before-deploying"


def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]
    if not url.startswith("postgresql+asyncpg://"):
        return url
    parts = urlsplit(url)
    query = []
    for key, value in parse_qsl(parts.query, keep_blank_values=True):
        if key == "sslmode":
            query.append(("ssl", value))
        elif key == "channel_binding":
            continue
        else:
            query.append((key, value))
    return urlunsplit(parts._replace(query=urlencode(query)))


class Settings(BaseSettings):
    PROJECT_NAME: str = "Mwenye-Nyumba Property Management"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: Literal["development", "test", "production"] = "development"

    SECRET_KEY: str = DEV_SECRET_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    INVITE_CODE_EXPIRE_DAYS: int = 7
    TIMEZONE: str = "Africa/Dar_es_Salaam"
    OVERDUE_CHECK_HOURS: int = 6

    PUBLIC_APP_URL: str = "http://localhost:3000"
    LANDLORD_SIGNUP_CODE: Optional[str] = None
    CRON_SECRET: Optional[str] = None

    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: Optional[str] = None
    SMTP_STARTTLS: bool = True

    AT_USERNAME: Optional[str] = None
    AT_API_KEY: Optional[str] = None
    AT_SENDER_ID: Optional[str] = None
    AT_BASE_URL: str = "https://api.africastalking.com/version1/messaging"

    S3_BUCKET: Optional[str] = None
    S3_ENDPOINT_URL: Optional[str] = None
    S3_REGION: str = "auto"
    S3_ACCESS_KEY_ID: Optional[str] = None
    S3_SECRET_ACCESS_KEY: Optional[str] = None
    PHOTO_URL_EXPIRE_SECONDS: int = 3600

    DATABASE_URL: str = "sqlite+aiosqlite:///./mwenyenyumba.db"

    CORS_ORIGINS: Annotated[List[str], NoDecode] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_cors_origins(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                import json

                return json.loads(v)
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def clean_database_url(cls, v: str) -> str:
        return normalize_database_url(v)

    @model_validator(mode="after")
    def enforce_production_rules(self):
        if self.ENVIRONMENT == "production":
            if self.SECRET_KEY == DEV_SECRET_KEY or len(self.SECRET_KEY) < 32:
                raise ValueError("SECRET_KEY must be a unique random value of at least 32 characters in production")
            if self.DATABASE_URL.startswith("sqlite"):
                raise ValueError("DATABASE_URL must point to PostgreSQL in production")
            if not self.CORS_ORIGINS or "*" in self.CORS_ORIGINS:
                raise ValueError("CORS_ORIGINS must list the exact frontend origins in production")
            if self.LANDLORD_SIGNUP_CODE is not None and len(self.LANDLORD_SIGNUP_CODE) < 12:
                raise ValueError("LANDLORD_SIGNUP_CODE must be at least 12 characters, or left unset to disable landlord sign-up")
        return self

    @property
    def email_enabled(self) -> bool:
        return bool(self.SMTP_HOST and self.SMTP_FROM)

    @property
    def sms_enabled(self) -> bool:
        return bool(self.AT_USERNAME and self.AT_API_KEY)

    @property
    def storage_enabled(self) -> bool:
        return bool(self.S3_BUCKET and self.S3_ACCESS_KEY_ID and self.S3_SECRET_ACCESS_KEY)

    @property
    def landlord_signup_enabled(self) -> bool:
        return bool(self.LANDLORD_SIGNUP_CODE)

    @property
    def serverless(self) -> bool:
        return bool(os.environ.get("VERCEL"))

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def auto_create_tables(self) -> bool:
        return not self.is_production

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

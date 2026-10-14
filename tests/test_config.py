import pytest
from pydantic import ValidationError

from app.core.config import DEV_SECRET_KEY, Settings, normalize_database_url


def test_production_rejects_default_secret():
    with pytest.raises(ValidationError):
        Settings(ENVIRONMENT="production", SECRET_KEY=DEV_SECRET_KEY, DATABASE_URL="postgresql://u:p@h/db", CORS_ORIGINS="https://app.example.com")


def test_production_rejects_sqlite_and_wildcard_cors():
    with pytest.raises(ValidationError):
        Settings(ENVIRONMENT="production", SECRET_KEY="x" * 40, DATABASE_URL="sqlite+aiosqlite:///./a.db", CORS_ORIGINS="https://a.com")
    with pytest.raises(ValidationError):
        Settings(ENVIRONMENT="production", SECRET_KEY="x" * 40, DATABASE_URL="postgresql://u:p@h/db", CORS_ORIGINS="*")


def test_production_accepts_valid_config():
    s = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="x" * 40,
        DATABASE_URL="postgres://u:p@h/db?sslmode=require&channel_binding=require",
        CORS_ORIGINS="https://a.com, https://b.com",
    )
    assert s.CORS_ORIGINS == ["https://a.com", "https://b.com"]
    assert s.DATABASE_URL == "postgresql+asyncpg://u:p@h/db?ssl=require"
    assert not s.auto_create_tables


def test_normalize_database_url():
    assert normalize_database_url("postgresql://u:p@h/db") == "postgresql+asyncpg://u:p@h/db"
    assert normalize_database_url("sqlite+aiosqlite:///./x.db") == "sqlite+aiosqlite:///./x.db"

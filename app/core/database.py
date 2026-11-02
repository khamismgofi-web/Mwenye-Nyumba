import uuid
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings

def engine_options(url: str, serverless: bool) -> dict:
    if url.startswith("sqlite"):
        return {"echo": False, "connect_args": {"check_same_thread": False}}
    if serverless:
        return {
            "echo": False,
            "poolclass": NullPool,
            "connect_args": {
                "statement_cache_size": 0,
                "prepared_statement_cache_size": 0,
                "prepared_statement_name_func": lambda: f"__asyncpg_{uuid.uuid4()}__",
            },
        }
    return {"echo": False, "pool_pre_ping": True, "pool_size": 5, "max_overflow": 10, "pool_recycle": 1800}


engine = create_async_engine(settings.DATABASE_URL, **engine_options(settings.DATABASE_URL, settings.serverless))

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

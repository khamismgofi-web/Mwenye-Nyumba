from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

SCHEMA_REVISION = "004_households_notebook"

OUT_OF_DATE = (
    "The database tables are not up to date. From your computer run: "
    "DATABASE_URL=<direct Neon string> alembic upgrade head"
)


async def schema_problem(engine: AsyncEngine) -> str | None:
    try:
        async with engine.connect() as conn:
            rows = (await conn.execute(text("SELECT version_num FROM alembic_version"))).scalars().all()
    except Exception:
        return OUT_OF_DATE + " (no migration history was found, so the database may have been created by an older version: run alembic stamp 001_initial_schema first, or start from an empty database)"
    if rows != [SCHEMA_REVISION]:
        return OUT_OF_DATE + f" (database is at {', '.join(rows) or 'nothing'}, the app needs {SCHEMA_REVISION})"
    return None


def looks_like_missing_schema(error: Exception) -> bool:
    text_ = str(error).lower()
    return any(
        marker in text_
        for marker in ("does not exist", "no such column", "no such table", "undefinedcolumn", "undefinedtable")
    )

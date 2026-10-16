import asyncio
import sys
from urllib.parse import urlsplit

from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine
from app.models import Base


async def wipe() -> None:
    async with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(text(f'DELETE FROM "{table.name}"'))
    await engine.dispose()


def main() -> None:
    target = urlsplit(settings.DATABASE_URL)
    host = target.hostname or "local file"
    print(f"This deletes EVERY row (all users, properties, tenants, payments) in database {target.path.lstrip('/') or ''} on {host}.")
    print("Photos in your storage bucket are not touched.")
    answer = input(f"Type the word {host} to continue: ").strip()
    if answer != host:
        print("Cancelled. Nothing was changed.")
        sys.exit(1)
    asyncio.run(wipe())
    print("Done. The database is empty. Create your landlord account next.")


if __name__ == "__main__":
    main()

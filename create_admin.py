import asyncio
import getpass
import os
import sys

from sqlalchemy import func, select

from app.core.database import AsyncSessionLocal, engine
from app.core.security import MAX_PASSWORD_BYTES, get_password_hash
from app.models import User, UserRole


async def create_admin(email: str, password: str) -> None:
    async with AsyncSessionLocal() as session:
        existing = (
            await session.execute(select(User.id).where(func.lower(User.email) == email.lower()))
        ).scalar_one_or_none()
        if existing:
            raise SystemExit(f"A user with email {email} already exists")
        session.add(
            User(
                email=email.lower(),
                hashed_password=get_password_hash(password),
                role=UserRole.ADMIN,
                is_active=True,
            )
        )
        await session.commit()
    await engine.dispose()
    print(f"Admin account created for {email}")


def main() -> None:
    email = os.environ.get("ADMIN_EMAIL") or (sys.argv[1] if len(sys.argv) > 1 else input("Admin email: ").strip())
    password = os.environ.get("ADMIN_PASSWORD") or getpass.getpass("Admin password: ")
    if len(password) < 12:
        raise SystemExit("Use a password of at least 12 characters for an admin account")
    if len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise SystemExit("Password must be at most 72 bytes")
    asyncio.run(create_admin(email, password))


if __name__ == "__main__":
    main()

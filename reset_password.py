import asyncio
import getpass
import os
import sys

from sqlalchemy import func, select

from app.core.database import AsyncSessionLocal, engine
from app.core.security import MAX_PASSWORD_BYTES, get_password_hash
from app.models import User


async def reset(email: str, password: str) -> None:
    async with AsyncSessionLocal() as session:
        user = (
            await session.execute(select(User).where(func.lower(User.email) == email.lower()))
        ).scalar_one_or_none()
        if not user:
            raise SystemExit(f"No user with email {email}")
        user.hashed_password = get_password_hash(password)
        await session.commit()
    await engine.dispose()
    print(f"Password changed for {email}")


def main() -> None:
    email = os.environ.get("RESET_EMAIL") or (sys.argv[1] if len(sys.argv) > 1 else input("Account email: ").strip())
    password = os.environ.get("RESET_PASSWORD") or getpass.getpass("New password: ")
    if len(password) < 8 or len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise SystemExit("Password must be 8 to 72 characters")
    asyncio.run(reset(email, password))


if __name__ == "__main__":
    main()

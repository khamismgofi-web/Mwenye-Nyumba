import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union

import jwt
from passlib.context import CryptContext

from app.core.config import settings

logging.getLogger("passlib").setLevel(logging.ERROR)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MAX_PASSWORD_BYTES = 72


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


DUMMY_HASH = get_password_hash("not-a-real-password")


def _create_token(subject: Union[str, Any], token_type: str, expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "iat": now,
        "exp": now + expires_delta,
        "sub": str(subject),
        "type": token_type,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    return _create_token(
        subject, "access", expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )


def create_refresh_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    return _create_token(
        subject, "refresh", expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

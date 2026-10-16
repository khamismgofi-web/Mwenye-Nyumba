from datetime import datetime, timezone
from typing import Any, Optional

import secrets

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_admin, get_current_user
from app.core.ratelimit import client_ip, landlord_signup_by_ip, login_by_account, login_by_ip, register_by_ip
from app.core.security import (
    DUMMY_HASH,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.invite_code import InviteCode
from app.models.tenant import Tenant
from app.models.unit import Unit, UnitStatus
from app.models.user import User, UserRole
from app.schemas.auth import AuthConfig, ChangePasswordRequest, LandlordRegisterRequest, ProfileUpdate, RegisterRequest
from app.schemas.token import RefreshTokenRequest, Token, TokenPayload
from app.schemas.user import UserLogin, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

INVALID_CODE = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Invalid or expired invitation code",
)


def build_token_response(user: User) -> dict:
    return {
        "access_token": create_access_token(subject=user.id),
        "refresh_token": create_refresh_token(subject=user.id),
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "role": user.role.value,
        "tenant_id": user.tenant.id if user.tenant else None,
        "unit_id": user.tenant.unit_id if user.tenant else None,
    }


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


async def authenticate(db: AsyncSession, request: Request, email: str, password: str) -> User:
    ip = client_ip(request)
    account_key = f"{ip}:{email.strip().lower()}"
    login_by_account.check(account_key)
    login_by_ip.check(ip)
    stmt = (
        select(User)
        .where(func.lower(User.email) == email.strip().lower())
        .options(selectinload(User.tenant))
    )
    user = (await db.execute(stmt)).scalar_one_or_none()
    password_ok = verify_password(password, user.hashed_password if user else DUMMY_HASH)
    if not user or not password_ok:
        login_by_account.record(account_key)
        login_by_ip.record(ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account")
    login_by_account.reset(account_key)
    return user


@router.post("/login", response_model=Token)
async def login_access_token(
    request: Request,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    user = await authenticate(db, request, form_data.username, form_data.password)
    return build_token_response(user)


@router.post("/login-json", response_model=Token)
async def login_json(request: Request, credentials: UserLogin, db: AsyncSession = Depends(get_db)) -> Any:
    user = await authenticate(db, request, credentials.email, credentials.password)
    return build_token_response(user)


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_tenant(request: Request, data: RegisterRequest, db: AsyncSession = Depends(get_db)) -> Any:
    ip = client_ip(request)
    register_by_ip.check(ip)
    email = data.email.strip().lower()
    code = data.invite_code.strip().upper()

    invite = (await db.execute(select(InviteCode).where(InviteCode.code == code))).scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if not invite or invite.used or as_utc(invite.expires_at) <= now:
        register_by_ip.record(ip)
        raise INVALID_CODE

    unit = (
        await db.execute(
            select(Unit).where(Unit.id == invite.unit_id).options(selectinload(Unit.tenants))
        )
    ).scalar_one_or_none()
    if not unit or unit.tenants or unit.status == UnitStatus.OCCUPIED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This unit is no longer available")

    existing = (
        await db.execute(select(User.id).where(func.lower(User.email) == email))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    user = User(
        email=email,
        hashed_password=get_password_hash(data.password),
        role=UserRole.TENANT,
        is_active=True,
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    consumed = await db.execute(
        update(InviteCode)
        .where(InviteCode.id == invite.id, InviteCode.used.is_(False))
        .values(used=True, used_by=user.id, used_at=now)
    )
    if consumed.rowcount != 1:
        raise INVALID_CODE

    tenant = Tenant(
        user_id=user.id,
        unit_id=unit.id,
        name=data.full_name,
        contact_info=data.phone,
        lease_start=invite.lease_start,
        lease_end=invite.lease_end,
    )
    db.add(tenant)
    unit.status = UnitStatus.OCCUPIED
    await db.flush()

    user = (
        await db.execute(select(User).where(User.id == user.id).options(selectinload(User.tenant)))
    ).scalar_one()
    return build_token_response(user)


@router.post("/refresh", response_model=Token)
async def refresh_token(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)) -> Any:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
    )
    try:
        token_data = TokenPayload(**decode_token(data.refresh_token))
        if token_data.sub is None or token_data.type != "refresh":
            raise credentials_exception
        user_id = int(token_data.sub)
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    stmt = select(User).where(User.id == user_id).options(selectinload(User.tenant))
    user: Optional[User] = (await db.execute(stmt)).scalar_one_or_none()
    if not user or not user.is_active:
        raise credentials_exception
    return build_token_response(user)


@router.get("/me", response_model=UserResponse)
async def read_current_user(current_user: User = Depends(get_current_user)) -> Any:
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "tenant_id": current_user.tenant.id if current_user.tenant else None,
        "unit_id": current_user.tenant.unit_id if current_user.tenant else None,
    }


@router.get("/config", response_model=AuthConfig)
async def public_config() -> Any:
    return AuthConfig(
        landlord_signup_enabled=settings.landlord_signup_enabled,
        email_alerts=settings.email_enabled,
        sms_alerts=settings.sms_enabled,
        photos=settings.storage_enabled,
    )


@router.post("/register-landlord", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_landlord(request: Request, data: LandlordRegisterRequest, db: AsyncSession = Depends(get_db)) -> Any:
    if not settings.landlord_signup_enabled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    ip = client_ip(request)
    landlord_signup_by_ip.check(ip)
    if not secrets.compare_digest(data.signup_code.encode(), settings.LANDLORD_SIGNUP_CODE.encode()):
        landlord_signup_by_ip.record(ip)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="That sign-up code is not valid")

    email = data.email.strip().lower()
    existing = (await db.execute(select(User.id).where(func.lower(User.email) == email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    user = User(
        email=email,
        hashed_password=get_password_hash(data.password),
        role=UserRole.ADMIN,
        is_active=True,
        full_name=data.full_name,
        phone=data.phone.strip(),
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")
    user = (
        await db.execute(select(User).where(User.id == user.id).options(selectinload(User.tenant)))
    ).scalar_one()
    return build_token_response(user)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    landlord: User = Depends(get_current_admin),
) -> Any:
    landlord.full_name = data.full_name.strip()
    landlord.phone = data.phone.strip()
    await db.commit()
    return {
        "id": landlord.id,
        "email": landlord.email,
        "full_name": landlord.full_name,
        "phone": landlord.phone,
        "role": landlord.role,
        "is_active": landlord.is_active,
        "created_at": landlord.created_at,
        "tenant_id": None,
        "unit_id": None,
    }


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    request: Request,
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    key = f"pw:{client_ip(request)}:{current_user.id}"
    login_by_account.check(key)
    if not verify_password(data.current_password, current_user.hashed_password):
        login_by_account.record(key)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Your current password is not correct")
    current_user.hashed_password = get_password_hash(data.new_password)
    await db.commit()
    login_by_account.reset(key)

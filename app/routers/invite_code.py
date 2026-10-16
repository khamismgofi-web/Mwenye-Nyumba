import secrets
from datetime import date, datetime, timedelta, timezone
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.core.scope import owned_property_ids, owned_unit_ids
from app.models.invite_code import InviteCode
from app.models.unit import Unit, UnitStatus
from app.models.user import User
from app.schemas.invite_code import InviteCodeCreate, InviteCodeResponse

router = APIRouter(prefix="/invite-codes", tags=["Invite Codes"])

CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CODE_LENGTH = 8


async def generate_unique_code(db: AsyncSession) -> str:
    for _ in range(10):
        code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))
        taken = (await db.execute(select(InviteCode.id).where(InviteCode.code == code))).scalar_one_or_none()
        if not taken:
            return code
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not generate a unique code")


@router.post("", response_model=InviteCodeResponse, status_code=status.HTTP_201_CREATED)
async def create_invite_code(
    payload: InviteCodeCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Any:
    unit = (
        await db.execute(
            select(Unit)
            .where(Unit.id == payload.unit_id, Unit.property_id.in_(owned_property_ids(admin)))
            .options(selectinload(Unit.tenants))
        )
    ).scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")
    if unit.tenants or unit.status == UnitStatus.OCCUPIED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Unit is already occupied")

    lease_start = payload.lease_start or date.today()
    lease_end = payload.lease_end or lease_start + timedelta(days=365)
    if lease_end <= lease_start:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="lease_end must be after lease_start")

    invite = InviteCode(
        code=await generate_unique_code(db),
        unit_id=unit.id,
        created_by=admin.id,
        lease_start=lease_start,
        lease_end=lease_end,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.INVITE_CODE_EXPIRE_DAYS),
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    return invite


@router.get("", response_model=List[InviteCodeResponse])
async def list_invite_codes(
    unit_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Any:
    stmt = (
        select(InviteCode)
        .where(InviteCode.unit_id.in_(owned_unit_ids(admin)))
        .order_by(desc(InviteCode.created_at))
    )
    if unit_id is not None:
        stmt = stmt.where(InviteCode.unit_id == unit_id)
    return (await db.execute(stmt)).scalars().all()


@router.delete("/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_invite_code(
    invite_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> None:
    invite = (
        await db.execute(
            select(InviteCode).where(InviteCode.id == invite_id, InviteCode.unit_id.in_(owned_unit_ids(admin)))
        )
    ).scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite code not found")
    if invite.used:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A used invite code cannot be revoked")
    await db.delete(invite)
    await db.commit()

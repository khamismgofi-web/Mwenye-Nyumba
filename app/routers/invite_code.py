# app/routers/invite_codes.py — admin generates a code for a unit
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.core.security import get_current_admin  #  existing admin-only dependency
from app.models.invite_code import InviteCode
from app.schemas.invite_code import InviteCodeCreate, InviteCodeResponse

router = APIRouter(prefix="/invite-codes", tags=["invite-codes"])

@router.post("", response_model=InviteCodeResponse)
async def create_invite_code(
    payload: InviteCodeCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    code = secrets.token_urlsafe(6)[:8].upper()
    invite = InviteCode(code=code, unit_id=payload.unit_id, created_by=admin.id)
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    return invite
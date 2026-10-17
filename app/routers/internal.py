import secrets
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, status

from app.core.config import settings
from app.core.jobs import mark_overdue_payments

router = APIRouter(prefix="/internal", tags=["Internal"], include_in_schema=False)


@router.get("/overdue")
async def run_overdue_check(authorization: Optional[str] = Header(None)) -> dict:
    if not settings.CRON_SECRET:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    expected = f"Bearer {settings.CRON_SECRET}"
    if not authorization or not secrets.compare_digest(authorization.encode(), expected.encode()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    return {"marked_overdue": await mark_overdue_payments()}

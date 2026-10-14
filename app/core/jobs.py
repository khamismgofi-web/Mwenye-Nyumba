import asyncio
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import update

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.payment import Payment, PaymentStatus

logger = logging.getLogger(__name__)


async def mark_overdue_payments() -> int:
    today = datetime.now(ZoneInfo(settings.TIMEZONE)).date()
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            update(Payment)
            .where(Payment.status == PaymentStatus.PENDING, Payment.due_date < today)
            .values(status=PaymentStatus.OVERDUE)
        )
        await session.commit()
        return result.rowcount or 0


async def overdue_loop() -> None:
    while True:
        try:
            changed = await mark_overdue_payments()
            if changed:
                logger.info("Marked %s payments overdue", changed)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Overdue check failed")
        await asyncio.sleep(settings.OVERDUE_CHECK_HOURS * 3600)

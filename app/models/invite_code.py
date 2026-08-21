# app/models/invite_code.py
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.core.db import Base

class InviteCode(Base):
    __tablename__ = "invite_codes"

    id: Mapped[int] = mapped_column(primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"))
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    used_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.payment import PaymentMethod, PaymentStatus


class PaymentBase(BaseModel):
    tenant_id: int
    amount: float = Field(..., gt=0)
    due_date: date
    paid_date: Optional[date] = None
    status: PaymentStatus = PaymentStatus.PENDING
    payment_method: Optional[PaymentMethod] = PaymentMethod.MPESA
    reference_code: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    due_date: Optional[date] = None
    paid_date: Optional[date] = None
    status: Optional[PaymentStatus] = None
    payment_method: Optional[PaymentMethod] = None
    reference_code: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(PaymentBase):
    id: int
    created_at: datetime
    tenant_name: Optional[str] = None
    unit_number: Optional[str] = None
    property_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

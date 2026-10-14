from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TenantBase(BaseModel):
    unit_id: int
    name: str = Field(..., min_length=1, max_length=255)
    contact_info: str = Field(..., min_length=1, max_length=255, description="Phone number or primary contact")
    lease_start: date
    lease_end: date
    national_id: Optional[str] = None


class TenantCreate(TenantBase):
    email: EmailStr = Field(..., description="Email for tenant login portal")
    password: str = Field(..., min_length=8, max_length=72, description="Initial password for tenant portal")


class TenantUpdate(BaseModel):
    unit_id: Optional[int] = None
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    contact_info: Optional[str] = Field(None, min_length=1, max_length=255)
    lease_start: Optional[date] = None
    lease_end: Optional[date] = None
    national_id: Optional[str] = None


class TenantResponse(TenantBase):
    id: int
    user_id: int
    email: Optional[str] = None
    created_at: datetime
    unit_number: Optional[str] = None
    property_name: Optional[str] = None
    property_id: Optional[int] = None
    rent_amount: Optional[float] = None
    balance_due: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)

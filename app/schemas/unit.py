from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.unit import UnitStatus


class UnitBase(BaseModel):
    property_id: int
    unit_number: str = Field(..., min_length=1, max_length=50)
    rent_amount: float = Field(..., gt=0)
    status: UnitStatus = UnitStatus.VACANT
    floor: Optional[int] = None
    bedrooms: Optional[int] = 1
    bathrooms: Optional[int] = 1


class UnitCreate(UnitBase):
    pass


class UnitUpdate(BaseModel):
    property_id: Optional[int] = None
    unit_number: Optional[str] = Field(None, min_length=1, max_length=50)
    rent_amount: Optional[float] = Field(None, gt=0)
    status: Optional[UnitStatus] = None
    floor: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None


class UnitResponse(UnitBase):
    id: int
    created_at: datetime
    property_name: Optional[str] = None
    current_tenant_name: Optional[str] = None
    current_tenant_id: Optional[int] = None
    photo_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

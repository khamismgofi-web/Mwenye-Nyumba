from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class PropertyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    address: str = Field(..., min_length=1, max_length=500)
    owner: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = ""


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    address: Optional[str] = Field(None, min_length=1, max_length=500)
    owner: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None


class PropertySummary(PropertyBase):
    id: int
    created_at: datetime
    total_units: int = 0
    occupied_units: int = 0
    vacant_units: int = 0
    total_revenue_potential: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class PropertyDetail(PropertyBase):
    id: int
    created_at: datetime
    # We will nest units if needed
    model_config = ConfigDict(from_attributes=True)

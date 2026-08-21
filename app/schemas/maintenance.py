from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.maintenance import MaintenancePriority, MaintenanceStatus


class MaintenanceBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=5)
    category: Optional[str] = "General"
    priority: MaintenancePriority = MaintenancePriority.MEDIUM


class MaintenanceCreate(MaintenanceBase):
    unit_id: Optional[int] = None  # If created by tenant, will automatically derive unit_id from tenant record


class MaintenanceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=5)
    category: Optional[str] = None
    priority: Optional[MaintenancePriority] = None
    status: Optional[MaintenanceStatus] = None
    admin_notes: Optional[str] = None


class MaintenanceResponse(MaintenanceBase):
    id: int
    tenant_id: int
    unit_id: int
    status: MaintenanceStatus
    admin_notes: Optional[str] = None
    created_at: datetime
    tenant_name: Optional[str] = None
    unit_number: Optional[str] = None
    property_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

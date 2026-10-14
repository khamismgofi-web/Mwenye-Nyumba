from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, model_validator


class InviteCodeCreate(BaseModel):
    unit_id: int
    lease_start: Optional[date] = None
    lease_end: Optional[date] = None

    @model_validator(mode="after")
    def check_dates(self):
        if self.lease_start and self.lease_end and self.lease_end <= self.lease_start:
            raise ValueError("lease_end must be after lease_start")
        return self


class InviteCodeResponse(BaseModel):
    id: int
    code: str
    unit_id: int
    used: bool
    lease_start: date
    lease_end: date
    expires_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

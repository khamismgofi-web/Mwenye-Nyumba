# app/schemas/invite_code.py
from pydantic import BaseModel
import uuid

class InviteCodeCreate(BaseModel):
    unit_id: int

class InviteCodeResponse(BaseModel):
    code: str
    unit_id: int
    used: bool

    class Config:
        from_attributes = True
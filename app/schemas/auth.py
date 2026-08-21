# app/schemas/auth.py — extend your existing register schema
from pydantic import BaseModel, EmailStr
from typing import Literal

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str
    role: Literal["admin", "tenant"]
    invite_code: str | None = None  # required if role == "tenant"
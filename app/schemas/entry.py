from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Kind = Literal["note", "plan", "expense"]


class EntryCreate(BaseModel):
    property_id: int
    unit_id: Optional[int] = None
    kind: Kind
    title: str = Field(..., min_length=1, max_length=200)
    body: Optional[str] = Field(None, max_length=5000)
    amount: Optional[float] = Field(None, ge=0, le=999_999_999_999)
    category: Optional[str] = Field(None, max_length=50)
    entry_date: Optional[date] = None
    target_date: Optional[date] = None


class EntryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    body: Optional[str] = Field(None, max_length=5000)
    amount: Optional[float] = Field(None, ge=0, le=999_999_999_999)
    category: Optional[str] = Field(None, max_length=50)
    entry_date: Optional[date] = None
    target_date: Optional[date] = None
    done: Optional[bool] = None


class EntryResponse(BaseModel):
    id: int
    property_id: int
    unit_id: Optional[int] = None
    kind: str
    title: str
    body: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    entry_date: date
    target_date: Optional[date] = None
    done: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

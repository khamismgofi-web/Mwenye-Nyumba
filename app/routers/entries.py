from datetime import date
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.core.scope import owned_property_ids
from app.models.entry import Entry
from app.models.property import Property
from app.models.unit import Unit
from app.models.user import User
from app.schemas.entry import EntryCreate, EntryResponse, EntryUpdate, Kind

router = APIRouter(prefix="/entries", tags=["Notebook"])


async def load_owned_entry(db: AsyncSession, landlord: User, entry_id: int) -> Entry:
    stmt = select(Entry).where(Entry.id == entry_id, Entry.property_id.in_(owned_property_ids(landlord)))
    entry = (await db.execute(stmt)).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    return entry


@router.get("", response_model=List[EntryResponse])
async def list_entries(
    property_id: Optional[int] = Query(None),
    unit_id: Optional[int] = Query(None),
    kind: Optional[Kind] = Query(None),
    db: AsyncSession = Depends(get_db),
    landlord: User = Depends(get_current_admin),
) -> Any:
    stmt = (
        select(Entry)
        .where(Entry.property_id.in_(owned_property_ids(landlord)))
        .order_by(Entry.entry_date.desc(), Entry.id.desc())
    )
    if property_id is not None:
        stmt = stmt.where(Entry.property_id == property_id)
    if unit_id is not None:
        stmt = stmt.where(Entry.unit_id == unit_id)
    if kind is not None:
        stmt = stmt.where(Entry.kind == kind)
    return (await db.execute(stmt)).scalars().all()


@router.post("", response_model=EntryResponse, status_code=status.HTTP_201_CREATED)
async def create_entry(
    data: EntryCreate,
    db: AsyncSession = Depends(get_db),
    landlord: User = Depends(get_current_admin),
) -> Any:
    prop = (
        await db.execute(select(Property.id).where(Property.id == data.property_id, Property.owner_id == landlord.id))
    ).scalar_one_or_none()
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if data.unit_id is not None:
        unit = (
            await db.execute(select(Unit.id).where(Unit.id == data.unit_id, Unit.property_id == data.property_id))
        ).scalar_one_or_none()
        if unit is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found in this property")
    if data.kind in ("plan", "expense") and data.amount is None and data.kind == "expense":
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="An expense needs an amount")
    entry = Entry(
        property_id=data.property_id,
        unit_id=data.unit_id,
        kind=data.kind,
        title=data.title.strip(),
        body=data.body,
        amount=data.amount,
        category=data.category,
        entry_date=data.entry_date or date.today(),
        target_date=data.target_date,
        done=False,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.put("/{entry_id}", response_model=EntryResponse)
async def update_entry(
    entry_id: int,
    data: EntryUpdate,
    db: AsyncSession = Depends(get_db),
    landlord: User = Depends(get_current_admin),
) -> Any:
    entry = await load_owned_entry(db, landlord, entry_id)
    for field, val in data.model_dump(exclude_unset=True).items():
        if field in ("title", "entry_date") and val is None:
            continue
        setattr(entry, field, val)
    if entry.kind == "expense" and entry.amount is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="An expense needs an amount")
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    landlord: User = Depends(get_current_admin),
) -> None:
    entry = await load_owned_entry(db, landlord, entry_id)
    await db.delete(entry)
    await db.commit()

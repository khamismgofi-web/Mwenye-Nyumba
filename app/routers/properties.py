from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.property import Property
from app.models.unit import Unit, UnitStatus
from app.models.user import User
from app.schemas.property import PropertyCreate, PropertySummary, PropertyUpdate

router = APIRouter(prefix="/properties", tags=["Properties"])


def summarize(prop: Property) -> PropertySummary:
    units = prop.units
    return PropertySummary(
        id=prop.id,
        name=prop.name,
        address=prop.address,
        owner=prop.owner,
        description=prop.description or "",
        created_at=prop.created_at,
        total_units=len(units),
        occupied_units=sum(1 for u in units if u.status == UnitStatus.OCCUPIED),
        vacant_units=sum(1 for u in units if u.status == UnitStatus.VACANT),
        total_revenue_potential=float(sum(u.rent_amount for u in units)),
    )


async def load_owned(db: AsyncSession, landlord: User, property_id: int, with_tenants: bool = False) -> Property:
    loader = selectinload(Property.units)
    if with_tenants:
        loader = loader.selectinload(Unit.tenants)
    stmt = (
        select(Property)
        .where(Property.id == property_id, Property.owner_id == landlord.id)
        .options(loader)
    )
    prop = (await db.execute(stmt)).scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return prop


@router.get("", response_model=List[PropertySummary])
async def list_properties(db: AsyncSession = Depends(get_db), landlord: User = Depends(get_current_admin)) -> Any:
    stmt = (
        select(Property)
        .where(Property.owner_id == landlord.id)
        .options(selectinload(Property.units))
        .order_by(Property.id)
    )
    return [summarize(p) for p in (await db.execute(stmt)).scalars().all()]


@router.post("", response_model=PropertySummary, status_code=status.HTTP_201_CREATED)
async def create_property(
    prop_in: PropertyCreate,
    db: AsyncSession = Depends(get_db),
    landlord: User = Depends(get_current_admin),
) -> Any:
    prop = Property(
        name=prop_in.name,
        address=prop_in.address,
        owner=prop_in.owner,
        owner_id=landlord.id,
        description=prop_in.description or "",
    )
    db.add(prop)
    await db.commit()
    return summarize(await load_owned(db, landlord, prop.id))


@router.get("/{property_id}", response_model=PropertySummary)
async def get_property(
    property_id: int,
    db: AsyncSession = Depends(get_db),
    landlord: User = Depends(get_current_admin),
) -> Any:
    return summarize(await load_owned(db, landlord, property_id))


@router.put("/{property_id}", response_model=PropertySummary)
async def update_property(
    property_id: int,
    prop_in: PropertyUpdate,
    db: AsyncSession = Depends(get_db),
    landlord: User = Depends(get_current_admin),
) -> Any:
    prop = await load_owned(db, landlord, property_id)
    for field, val in prop_in.model_dump(exclude_unset=True).items():
        setattr(prop, field, val)
    await db.commit()
    return summarize(await load_owned(db, landlord, property_id))


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: int,
    db: AsyncSession = Depends(get_db),
    landlord: User = Depends(get_current_admin),
) -> None:
    prop = await load_owned(db, landlord, property_id, with_tenants=True)
    if any(u.tenants for u in prop.units):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a property that has tenants. Remove the tenants first",
        )
    from app.services.storage import delete_photo

    keys = [u.photo_key for u in prop.units if u.photo_key]
    await db.delete(prop)
    await db.commit()
    for key in keys:
        await delete_photo(key)

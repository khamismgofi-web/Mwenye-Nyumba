from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.models.property import Property
from app.models.unit import Unit, UnitStatus
from app.models.user import User, UserRole
from app.schemas.property import PropertyCreate, PropertyDetail, PropertySummary, PropertyUpdate

router = APIRouter(prefix="/properties", tags=["Properties"])


@router.get("", response_model=List[PropertySummary])
async def list_properties(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """List all properties with occupancy summaries (Admin only)."""
    stmt = select(Property).options(selectinload(Property.units))
    result = await db.execute(stmt)
    properties = result.scalars().all()

    summaries = []
    for prop in properties:
        total_units = len(prop.units)
        occupied_units = sum(1 for u in prop.units if u.status == UnitStatus.OCCUPIED)
        vacant_units = sum(1 for u in prop.units if u.status == UnitStatus.VACANT)
        total_revenue_potential = sum(u.rent_amount for u in prop.units)

        summaries.append(
            PropertySummary(
                id=prop.id,
                name=prop.name,
                address=prop.address,
                owner=prop.owner,
                description=prop.description or "",
                created_at=prop.created_at,
                total_units=total_units,
                occupied_units=occupied_units,
                vacant_units=vacant_units,
                total_revenue_potential=total_revenue_potential,
            )
        )
    return summaries


@router.post("", response_model=PropertySummary, status_code=status.HTTP_201_CREATED)
async def create_property(
    prop_in: PropertyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """Create a new property (Admin only)."""
    property_obj = Property(
        name=prop_in.name,
        address=prop_in.address,
        owner=prop_in.owner,
        description=prop_in.description or ""
    )
    db.add(property_obj)
    await db.commit()
    await db.refresh(property_obj)

    return PropertySummary(
        id=property_obj.id,
        name=property_obj.name,
        address=property_obj.address,
        owner=property_obj.owner,
        description=property_obj.description or "",
        created_at=property_obj.created_at,
        total_units=0,
        occupied_units=0,
        vacant_units=0,
        total_revenue_potential=0.0
    )


@router.get("/{property_id}", response_model=PropertySummary)
async def get_property(
    property_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """Get single property details by ID (Admin only)."""
    stmt = select(Property).where(Property.id == property_id).options(selectinload(Property.units))
    result = await db.execute(stmt)
    prop = result.scalar_one_or_none()

    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )

    total_units = len(prop.units)
    occupied_units = sum(1 for u in prop.units if u.status == UnitStatus.OCCUPIED)
    vacant_units = sum(1 for u in prop.units if u.status == UnitStatus.VACANT)
    total_revenue_potential = sum(u.rent_amount for u in prop.units)

    return PropertySummary(
        id=prop.id,
        name=prop.name,
        address=prop.address,
        owner=prop.owner,
        description=prop.description or "",
        created_at=prop.created_at,
        total_units=total_units,
        occupied_units=occupied_units,
        vacant_units=vacant_units,
        total_revenue_potential=total_revenue_potential,
    )


@router.put("/{property_id}", response_model=PropertySummary)
async def update_property(
    property_id: int,
    prop_in: PropertyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """Update a property (Admin only)."""
    stmt = select(Property).where(Property.id == property_id).options(selectinload(Property.units))
    result = await db.execute(stmt)
    prop = result.scalar_one_or_none()

    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )

    update_data = prop_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(prop, field, val)

    await db.commit()
    await db.refresh(prop)

    total_units = len(prop.units)
    occupied_units = sum(1 for u in prop.units if u.status == UnitStatus.OCCUPIED)
    vacant_units = sum(1 for u in prop.units if u.status == UnitStatus.VACANT)
    total_revenue_potential = sum(u.rent_amount for u in prop.units)

    return PropertySummary(
        id=prop.id,
        name=prop.name,
        address=prop.address,
        owner=prop.owner,
        description=prop.description or "",
        created_at=prop.created_at,
        total_units=total_units,
        occupied_units=occupied_units,
        vacant_units=vacant_units,
        total_revenue_potential=total_revenue_potential,
    )


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> None:
    """Delete a property (Admin only). Cascade deletes units."""
    stmt = (
        select(Property)
        .where(Property.id == property_id)
        .options(selectinload(Property.units).selectinload(Unit.tenants))
    )
    result = await db.execute(stmt)
    prop = result.scalar_one_or_none()

    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    if any(u.tenants for u in prop.units):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a property that has tenants. Remove the tenants first"
        )

    await db.delete(prop)
    await db.commit()

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.models.property import Property
from app.models.tenant import Tenant
from app.models.unit import Unit, UnitStatus
from app.models.user import User, UserRole
from app.schemas.unit import UnitCreate, UnitResponse, UnitUpdate

router = APIRouter(prefix="/units", tags=["Units"])


@router.get("", response_model=List[UnitResponse])
async def list_units(
    property_id: Optional[int] = Query(None, description="Filter units by property ID"),
    status_filter: Optional[UnitStatus] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    List units:
    - Admin can view all units across all properties.
    - Tenant can only view their own leased unit.
    """
    if current_user.role == UserRole.TENANT:
        if not current_user.tenant or not current_user.tenant.unit_id:
            return []
        stmt = (
            select(Unit)
            .where(Unit.id == current_user.tenant.unit_id)
            .options(selectinload(Unit.property), selectinload(Unit.tenants))
        )
    else:
        stmt = select(Unit).options(selectinload(Unit.property), selectinload(Unit.tenants))
        if property_id is not None:
            stmt = stmt.where(Unit.property_id == property_id)
        if status_filter is not None:
            stmt = stmt.where(Unit.status == status_filter)

    result = await db.execute(stmt)
    units = result.scalars().all()

    response = []
    for u in units:
        tenant_name = u.tenants[0].name if u.tenants else None
        tenant_id = u.tenants[0].id if u.tenants else None
        response.append(
            UnitResponse(
                id=u.id,
                property_id=u.property_id,
                unit_number=u.unit_number,
                rent_amount=u.rent_amount,
                status=u.status,
                floor=u.floor,
                bedrooms=u.bedrooms,
                bathrooms=u.bathrooms,
                created_at=u.created_at,
                property_name=u.property.name if u.property else None,
                current_tenant_name=tenant_name,
                current_tenant_id=tenant_id,
            )
        )
    return response


@router.post("", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
async def create_unit(
    unit_in: UnitCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """Create a new rental unit (Admin only)."""
    # Verify property exists
    prop = await db.get(Property, unit_in.property_id)
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )

    unit = Unit(
        property_id=unit_in.property_id,
        unit_number=unit_in.unit_number,
        rent_amount=unit_in.rent_amount,
        status=unit_in.status,
        floor=unit_in.floor,
        bedrooms=unit_in.bedrooms,
        bathrooms=unit_in.bathrooms,
    )
    db.add(unit)
    await db.commit()
    await db.refresh(unit)

    return UnitResponse(
        id=unit.id,
        property_id=unit.property_id,
        unit_number=unit.unit_number,
        rent_amount=unit.rent_amount,
        status=unit.status,
        floor=unit.floor,
        bedrooms=unit.bedrooms,
        bathrooms=unit.bathrooms,
        created_at=unit.created_at,
        property_name=prop.name,
        current_tenant_name=None,
        current_tenant_id=None,
    )


@router.get("/{unit_id}", response_model=UnitResponse)
async def get_unit(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get unit details:
    - If Tenant: Allowed only if unit is assigned to them, otherwise HTTP 403 Forbidden.
    """
    if current_user.role == UserRole.TENANT:
        if not current_user.tenant or current_user.tenant.unit_id != unit_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you do not have permission to access another tenant's unit"
            )

    stmt = (
        select(Unit)
        .where(Unit.id == unit_id)
        .options(selectinload(Unit.property), selectinload(Unit.tenants))
    )
    result = await db.execute(stmt)
    unit = result.scalar_one_or_none()

    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unit not found"
        )

    tenant_name = unit.tenants[0].name if unit.tenants else None
    tenant_id = unit.tenants[0].id if unit.tenants else None

    return UnitResponse(
        id=unit.id,
        property_id=unit.property_id,
        unit_number=unit.unit_number,
        rent_amount=unit.rent_amount,
        status=unit.status,
        floor=unit.floor,
        bedrooms=unit.bedrooms,
        bathrooms=unit.bathrooms,
        created_at=unit.created_at,
        property_name=unit.property.name if unit.property else None,
        current_tenant_name=tenant_name,
        current_tenant_id=tenant_id,
    )


@router.put("/{unit_id}", response_model=UnitResponse)
async def update_unit(
    unit_id: int,
    unit_in: UnitUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """Update unit details (Admin only)."""
    stmt = (
        select(Unit)
        .where(Unit.id == unit_id)
        .options(selectinload(Unit.property), selectinload(Unit.tenants))
    )
    result = await db.execute(stmt)
    unit = result.scalar_one_or_none()

    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unit not found"
        )

    update_data = unit_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(unit, field, val)

    await db.commit()
    await db.refresh(unit)

    tenant_name = unit.tenants[0].name if unit.tenants else None
    tenant_id = unit.tenants[0].id if unit.tenants else None

    return UnitResponse(
        id=unit.id,
        property_id=unit.property_id,
        unit_number=unit.unit_number,
        rent_amount=unit.rent_amount,
        status=unit.status,
        floor=unit.floor,
        bedrooms=unit.bedrooms,
        bathrooms=unit.bathrooms,
        created_at=unit.created_at,
        property_name=unit.property.name if unit.property else None,
        current_tenant_name=tenant_name,
        current_tenant_id=tenant_id,
    )


@router.delete("/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_unit(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> None:
    """Delete a unit (Admin only)."""
    stmt = select(Unit).where(Unit.id == unit_id).options(selectinload(Unit.tenants))
    result = await db.execute(stmt)
    unit = result.scalar_one_or_none()

    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unit not found"
        )
    if unit.tenants:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a unit that has a tenant. Remove the tenant first"
        )

    await db.delete(unit)
    await db.commit()

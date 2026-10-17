from typing import Any, List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.core.scope import owned_property_ids
from app.models.property import Property
from app.models.unit import Unit, UnitStatus
from app.models.user import User, UserRole
from app.schemas.unit import UnitCreate, UnitResponse, UnitUpdate
from app.services import storage

router = APIRouter(prefix="/units", tags=["Units"])

LOADERS = (selectinload(Unit.property), selectinload(Unit.tenants))


def to_response(u: Unit) -> UnitResponse:
    tenant = u.tenants[0] if u.tenants else None
    return UnitResponse(
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
        current_tenant_name=tenant.name if tenant else None,
        current_tenant_id=tenant.id if tenant else None,
        photo_url=storage.photo_url(u.photo_key),
    )


async def load_owned_unit(db: AsyncSession, landlord: User, unit_id: int) -> Unit:
    stmt = (
        select(Unit)
        .where(Unit.id == unit_id, Unit.property_id.in_(owned_property_ids(landlord)))
        .options(*LOADERS)
        .execution_options(populate_existing=True)
    )
    unit = (await db.execute(stmt)).scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")
    return unit


async def owned_property(db: AsyncSession, landlord: User, property_id: int) -> Property:
    prop = (
        await db.execute(select(Property).where(Property.id == property_id, Property.owner_id == landlord.id))
    ).scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return prop


@router.get("", response_model=List[UnitResponse])
async def list_units(
    property_id: Optional[int] = Query(None),
    status_filter: Optional[UnitStatus] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role == UserRole.TENANT:
        if not current_user.tenant:
            return []
        stmt = select(Unit).where(Unit.id == current_user.tenant.unit_id).options(*LOADERS)
    else:
        stmt = (
            select(Unit)
            .where(Unit.property_id.in_(owned_property_ids(current_user)))
            .options(*LOADERS)
            .order_by(Unit.id)
        )
        if property_id is not None:
            stmt = stmt.where(Unit.property_id == property_id)
        if status_filter is not None:
            stmt = stmt.where(Unit.status == status_filter)
    return [to_response(u) for u in (await db.execute(stmt)).scalars().all()]


@router.post("", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
async def create_unit(
    unit_in: UnitCreate,
    db: AsyncSession = Depends(get_db),
    landlord: User = Depends(get_current_admin),
) -> Any:
    await owned_property(db, landlord, unit_in.property_id)
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
    return to_response(await load_owned_unit(db, landlord, unit.id))


@router.get("/{unit_id}", response_model=UnitResponse)
async def get_unit(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role == UserRole.TENANT:
        if not current_user.tenant or current_user.tenant.unit_id != unit_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you do not have permission to access another tenant's unit",
            )
        unit = (await db.execute(select(Unit).where(Unit.id == unit_id).options(*LOADERS))).scalar_one_or_none()
        if not unit:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")
        return to_response(unit)
    return to_response(await load_owned_unit(db, current_user, unit_id))


@router.put("/{unit_id}", response_model=UnitResponse)
async def update_unit(
    unit_id: int,
    unit_in: UnitUpdate,
    db: AsyncSession = Depends(get_db),
    landlord: User = Depends(get_current_admin),
) -> Any:
    unit = await load_owned_unit(db, landlord, unit_id)
    data = unit_in.model_dump(exclude_unset=True)
    if "property_id" in data and data["property_id"] != unit.property_id:
        if unit.tenants:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot move a unit that has a tenant")
        await owned_property(db, landlord, data["property_id"])
    for field, val in data.items():
        setattr(unit, field, val)
    await db.commit()
    return to_response(await load_owned_unit(db, landlord, unit_id))


@router.delete("/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_unit(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    landlord: User = Depends(get_current_admin),
) -> None:
    unit = await load_owned_unit(db, landlord, unit_id)
    if unit.tenants:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a unit that has a tenant. Remove the tenant first",
        )
    key = unit.photo_key
    await db.delete(unit)
    await db.commit()
    await storage.delete_photo(key)


@router.post("/{unit_id}/photo", response_model=UnitResponse)
async def upload_unit_photo(
    unit_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    landlord: User = Depends(get_current_admin),
) -> Any:
    if not settings.storage_enabled:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Photo storage is not set up yet")
    unit = await load_owned_unit(db, landlord, unit_id)
    raw = await file.read(storage.MAX_UPLOAD_BYTES + 1)
    if len(raw) > storage.MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Photo is too large (4 MB maximum)")
    try:
        new_key = await storage.save_unit_photo(unit.id, raw)
    except storage.InvalidImage as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Could not save the photo. Try again")
    old_key = unit.photo_key
    unit.photo_key = new_key
    await db.commit()
    await storage.delete_photo(old_key)
    return to_response(await load_owned_unit(db, landlord, unit_id))


@router.delete("/{unit_id}/photo", response_model=UnitResponse)
async def remove_unit_photo(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    landlord: User = Depends(get_current_admin),
) -> Any:
    unit = await load_owned_unit(db, landlord, unit_id)
    old_key = unit.photo_key
    unit.photo_key = None
    await db.commit()
    await storage.delete_photo(old_key)
    return to_response(await load_owned_unit(db, landlord, unit_id))

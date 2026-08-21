from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.core.security import get_password_hash
from app.models.payment import Payment, PaymentStatus
from app.models.tenant import Tenant
from app.models.unit import Unit, UnitStatus
from app.models.user import User, UserRole
from app.schemas.tenant import TenantCreate, TenantResponse, TenantUpdate

router = APIRouter(prefix="/tenants", tags=["Tenants"])


@router.get("", response_model=List[TenantResponse])
async def list_tenants(
    search: Optional[str] = Query(None, description="Search by name, email, or unit number"),
    unit_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    List tenants:
    - Admin: can list and search all tenants.
    - Tenant: only returns their own tenant record.
    """
    if current_user.role == UserRole.TENANT:
        if not current_user.tenant:
            return []
        stmt = (
            select(Tenant)
            .where(Tenant.id == current_user.tenant.id)
            .options(
                selectinload(Tenant.user),
                selectinload(Tenant.unit).selectinload(Unit.property),
                selectinload(Tenant.payments),
            )
        )
    else:
        stmt = select(Tenant).options(
            selectinload(Tenant.user),
            selectinload(Tenant.unit).selectinload(Unit.property),
            selectinload(Tenant.payments),
        )
        if unit_id is not None:
            stmt = stmt.where(Tenant.unit_id == unit_id)

    result = await db.execute(stmt)
    tenants = result.scalars().all()

    response = []
    for t in tenants:
        if search:
            query = search.lower()
            match = (
                query in t.name.lower()
                or (t.user and query in t.user.email.lower())
                or (t.unit and query in t.unit.unit_number.lower())
                or (t.contact_info and query in t.contact_info.lower())
            )
            if not match:
                continue

        # Calculate balance due
        balance = sum(
            p.amount for p in t.payments if p.status in [PaymentStatus.PENDING, PaymentStatus.OVERDUE]
        )

        response.append(
            TenantResponse(
                id=t.id,
                user_id=t.user_id,
                unit_id=t.unit_id,
                name=t.name,
                contact_info=t.contact_info,
                lease_start=t.lease_start,
                lease_end=t.lease_end,
                national_id=t.national_id,
                email=t.user.email if t.user else None,
                created_at=t.created_at,
                unit_number=t.unit.unit_number if t.unit else None,
                property_name=t.unit.property.name if t.unit and t.unit.property else None,
                property_id=t.unit.property.id if t.unit and t.unit.property else None,
                rent_amount=t.unit.rent_amount if t.unit else None,
                balance_due=balance,
            )
        )
    return response


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_in: TenantCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """Create tenant record, provision user account, and occupy unit (Admin only)."""
    # 1. Check if email already exists
    user_stmt = select(User).where(User.email == tenant_in.email)
    user_res = await db.execute(user_stmt)
    if user_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )

    # 2. Check if unit exists and is available
    unit_stmt = select(Unit).where(Unit.id == tenant_in.unit_id).options(selectinload(Unit.property))
    unit_res = await db.execute(unit_stmt)
    unit = unit_res.scalar_one_or_none()
    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unit not found"
        )

    # 3. Create User record
    raw_password = tenant_in.password or "tenant123"
    new_user = User(
        email=tenant_in.email,
        hashed_password=get_password_hash(raw_password),
        role=UserRole.TENANT,
        is_active=True,
    )
    db.add(new_user)
    await db.flush()

    # 4. Create Tenant record
    new_tenant = Tenant(
        user_id=new_user.id,
        unit_id=tenant_in.unit_id,
        name=tenant_in.name,
        contact_info=tenant_in.contact_info,
        lease_start=tenant_in.lease_start,
        lease_end=tenant_in.lease_end,
        national_id=tenant_in.national_id,
    )
    db.add(new_tenant)

    # 5. Mark unit as occupied
    unit.status = UnitStatus.OCCUPIED

    await db.commit()
    await db.refresh(new_tenant)

    return TenantResponse(
        id=new_tenant.id,
        user_id=new_user.id,
        unit_id=new_tenant.unit_id,
        name=new_tenant.name,
        contact_info=new_tenant.contact_info,
        lease_start=new_tenant.lease_start,
        lease_end=new_tenant.lease_end,
        national_id=new_tenant.national_id,
        email=new_user.email,
        created_at=new_tenant.created_at,
        unit_number=unit.unit_number,
        property_name=unit.property.name if unit.property else None,
        property_id=unit.property_id,
        rent_amount=unit.rent_amount,
        balance_due=0.0,
    )


@router.get("/me", response_model=TenantResponse)
async def get_my_tenant_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get authenticated tenant's own profile."""
    if not current_user.tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant profile not found for this account"
        )
    stmt = (
        select(Tenant)
        .where(Tenant.id == current_user.tenant.id)
        .options(
            selectinload(Tenant.user),
            selectinload(Tenant.unit).selectinload(Unit.property),
            selectinload(Tenant.payments),
        )
    )
    result = await db.execute(stmt)
    t = result.scalar_one_or_none()

    balance = sum(
        p.amount for p in t.payments if p.status in [PaymentStatus.PENDING, PaymentStatus.OVERDUE]
    )

    return TenantResponse(
        id=t.id,
        user_id=t.user_id,
        unit_id=t.unit_id,
        name=t.name,
        contact_info=t.contact_info,
        lease_start=t.lease_start,
        lease_end=t.lease_end,
        national_id=t.national_id,
        email=t.user.email if t.user else None,
        created_at=t.created_at,
        unit_number=t.unit.unit_number if t.unit else None,
        property_name=t.unit.property.name if t.unit and t.unit.property else None,
        property_id=t.unit.property.id if t.unit and t.unit.property else None,
        rent_amount=t.unit.rent_amount if t.unit else None,
        balance_due=balance,
    )


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get tenant by ID.
    - If tenant tries accessing another tenant's ID: return HTTP 403 Forbidden.
    """
    if current_user.role == UserRole.TENANT:
        if not current_user.tenant or current_user.tenant.id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you do not have permission to view this tenant profile"
            )

    stmt = (
        select(Tenant)
        .where(Tenant.id == tenant_id)
        .options(
            selectinload(Tenant.user),
            selectinload(Tenant.unit).selectinload(Unit.property),
            selectinload(Tenant.payments),
        )
    )
    result = await db.execute(stmt)
    t = result.scalar_one_or_none()

    if not t:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )

    balance = sum(
        p.amount for p in t.payments if p.status in [PaymentStatus.PENDING, PaymentStatus.OVERDUE]
    )

    return TenantResponse(
        id=t.id,
        user_id=t.user_id,
        unit_id=t.unit_id,
        name=t.name,
        contact_info=t.contact_info,
        lease_start=t.lease_start,
        lease_end=t.lease_end,
        national_id=t.national_id,
        email=t.user.email if t.user else None,
        created_at=t.created_at,
        unit_number=t.unit.unit_number if t.unit else None,
        property_name=t.unit.property.name if t.unit and t.unit.property else None,
        property_id=t.unit.property.id if t.unit and t.unit.property else None,
        rent_amount=t.unit.rent_amount if t.unit else None,
        balance_due=balance,
    )


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: int,
    tenant_in: TenantUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """Update tenant info or unit reassignment (Admin only)."""
    stmt = (
        select(Tenant)
        .where(Tenant.id == tenant_id)
        .options(
            selectinload(Tenant.user),
            selectinload(Tenant.unit).selectinload(Unit.property),
            selectinload(Tenant.payments),
        )
    )
    result = await db.execute(stmt)
    t = result.scalar_one_or_none()

    if not t:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )

    old_unit_id = t.unit_id
    update_data = tenant_in.model_dump(exclude_unset=True)

    # If unit changed, update unit occupancy statuses
    if "unit_id" in update_data and update_data["unit_id"] != old_unit_id:
        new_unit = await db.get(Unit, update_data["unit_id"])
        if not new_unit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="New unit not found"
            )
        new_unit.status = UnitStatus.OCCUPIED
        if t.unit:
            t.unit.status = UnitStatus.VACANT

    for field, val in update_data.items():
        setattr(t, field, val)

    await db.commit()
    await db.refresh(t)

    balance = sum(
        p.amount for p in t.payments if p.status in [PaymentStatus.PENDING, PaymentStatus.OVERDUE]
    )

    return TenantResponse(
        id=t.id,
        user_id=t.user_id,
        unit_id=t.unit_id,
        name=t.name,
        contact_info=t.contact_info,
        lease_start=t.lease_start,
        lease_end=t.lease_end,
        national_id=t.national_id,
        email=t.user.email if t.user else None,
        created_at=t.created_at,
        unit_number=t.unit.unit_number if t.unit else None,
        property_name=t.unit.property.name if t.unit and t.unit.property else None,
        property_id=t.unit.property.id if t.unit and t.unit.property else None,
        rent_amount=t.unit.rent_amount if t.unit else None,
        balance_due=balance,
    )


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> None:
    """Delete tenant, free up unit, and remove user account (Admin only)."""
    stmt = (
        select(Tenant)
        .where(Tenant.id == tenant_id)
        .options(selectinload(Tenant.unit), selectinload(Tenant.user))
    )
    result = await db.execute(stmt)
    t = result.scalar_one_or_none()

    if not t:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )

    # Free unit status
    if t.unit:
        t.unit.status = UnitStatus.VACANT

    # Delete User (cascades tenant record)
    if t.user:
        await db.delete(t.user)
    else:
        await db.delete(t)

    await db.commit()

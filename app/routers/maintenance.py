from typing import Any, List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.core.scope import owned_unit_ids
from app.services.notify import RepairAlert, notify_landlord_of_repair
from app.models.maintenance import MaintenancePriority, MaintenanceRequest, MaintenanceStatus
from app.models.tenant import Tenant
from app.models.unit import Unit
from app.models.user import User, UserRole
from app.schemas.maintenance import MaintenanceCreate, MaintenanceResponse, MaintenanceUpdate

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


@router.get("", response_model=List[MaintenanceResponse])
async def list_maintenance_requests(
    status_filter: Optional[MaintenanceStatus] = Query(None, alias="status"),
    priority_filter: Optional[MaintenancePriority] = Query(None, alias="priority"),
    unit_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    List maintenance requests:
    - Admin: lists all requests across all units/properties with filters.
    - Tenant: lists only requests submitted by their account.
    """
    stmt = select(MaintenanceRequest).options(
        selectinload(MaintenanceRequest.tenant),
        selectinload(MaintenanceRequest.unit).selectinload(Unit.property)
    ).order_by(desc(MaintenanceRequest.created_at))

    if current_user.role == UserRole.TENANT:
        if not current_user.tenant:
            return []
        stmt = stmt.where(MaintenanceRequest.tenant_id == current_user.tenant.id)
    else:
        stmt = stmt.where(MaintenanceRequest.unit_id.in_(owned_unit_ids(current_user)))
        if status_filter is not None:
            stmt = stmt.where(MaintenanceRequest.status == status_filter)
        if priority_filter is not None:
            stmt = stmt.where(MaintenanceRequest.priority == priority_filter)
        if unit_id is not None:
            stmt = stmt.where(MaintenanceRequest.unit_id == unit_id)

    result = await db.execute(stmt)
    requests = result.scalars().all()

    response = []
    for r in requests:
        t_name = r.tenant.name if r.tenant else None
        u_num = r.unit.unit_number if r.unit else None
        prop_name = r.unit.property.name if r.unit and r.unit.property else None

        response.append(
            MaintenanceResponse(
                id=r.id,
                tenant_id=r.tenant_id,
                unit_id=r.unit_id,
                title=r.title,
                description=r.description,
                category=r.category,
                priority=r.priority,
                status=r.status,
                admin_notes=r.admin_notes,
                created_at=r.created_at,
                tenant_name=t_name,
                unit_number=u_num,
                property_name=prop_name,
            )
        )
    return response


@router.post("", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
async def create_maintenance_request(
    req_in: MaintenanceCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Create a new maintenance request:
    - Tenant: Automatically uses authenticated tenant's ID and unit ID.
    - Admin: Can specify unit_id and will find current tenant or create ticket for unit.
    """
    if current_user.role == UserRole.TENANT:
        if not current_user.tenant:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No tenant profile associated with this account"
            )
        tenant_id = current_user.tenant.id
        unit_id = current_user.tenant.unit_id
    else:
        # Admin creating on behalf
        if not req_in.unit_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="unit_id is required when creating request as admin"
            )
        unit_id = req_in.unit_id
        tenant_stmt = select(Tenant).where(Tenant.unit_id == unit_id, Tenant.unit_id.in_(owned_unit_ids(current_user)))
        res = await db.execute(tenant_stmt)
        tenant = res.scalar_one_or_none()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active tenant assigned to this unit"
            )
        tenant_id = tenant.id

    maintenance_obj = MaintenanceRequest(
        tenant_id=tenant_id,
        unit_id=unit_id,
        title=req_in.title,
        description=req_in.description,
        category=req_in.category or "General",
        priority=req_in.priority,
        status=MaintenanceStatus.PENDING,
    )
    db.add(maintenance_obj)
    await db.commit()
    await db.refresh(maintenance_obj)

    # Fetch loaded relationships
    stmt = (
        select(MaintenanceRequest)
        .where(MaintenanceRequest.id == maintenance_obj.id)
        .options(
            selectinload(MaintenanceRequest.tenant),
            selectinload(MaintenanceRequest.unit).selectinload(Unit.property)
        )
    )
    res = await db.execute(stmt)
    m = res.scalar_one()

    if current_user.role == UserRole.TENANT and m.unit and m.unit.property:
        landlord = await db.get(User, m.unit.property.owner_id)
        if landlord:
            background_tasks.add_task(
                notify_landlord_of_repair,
                RepairAlert(
                    landlord_email=landlord.email,
                    landlord_phone=landlord.phone,
                    tenant_name=m.tenant.name if m.tenant else "A tenant",
                    tenant_phone=m.tenant.contact_info if m.tenant else None,
                    unit_number=m.unit.unit_number,
                    property_name=m.unit.property.name,
                    title=m.title,
                    description=m.description,
                    category=m.category,
                    priority=m.priority.value if hasattr(m.priority, "value") else str(m.priority),
                ),
            )

    return MaintenanceResponse(
        id=m.id,
        tenant_id=m.tenant_id,
        unit_id=m.unit_id,
        title=m.title,
        description=m.description,
        category=m.category,
        priority=m.priority,
        status=m.status,
        admin_notes=m.admin_notes,
        created_at=m.created_at,
        tenant_name=m.tenant.name if m.tenant else None,
        unit_number=m.unit.unit_number if m.unit else None,
        property_name=m.unit.property.name if m.unit and m.unit.property else None,
    )


@router.get("/{request_id}", response_model=MaintenanceResponse)
async def get_maintenance_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get single maintenance request:
    - Tenant requesting another tenant's ticket: return HTTP 403 Forbidden.
    """
    stmt = (
        select(MaintenanceRequest)
        .where(MaintenanceRequest.id == request_id)
        .options(
            selectinload(MaintenanceRequest.tenant),
            selectinload(MaintenanceRequest.unit).selectinload(Unit.property)
        )
    )
    if current_user.role == UserRole.ADMIN:
        stmt = stmt.where(MaintenanceRequest.unit_id.in_(owned_unit_ids(current_user)))
    result = await db.execute(stmt)
    m = result.scalar_one_or_none()

    if not m:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance request not found"
        )

    if current_user.role == UserRole.TENANT:
        if not current_user.tenant or m.tenant_id != current_user.tenant.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you do not have permission to view this maintenance request"
            )

    return MaintenanceResponse(
        id=m.id,
        tenant_id=m.tenant_id,
        unit_id=m.unit_id,
        title=m.title,
        description=m.description,
        category=m.category,
        priority=m.priority,
        status=m.status,
        admin_notes=m.admin_notes,
        created_at=m.created_at,
        tenant_name=m.tenant.name if m.tenant else None,
        unit_number=m.unit.unit_number if m.unit else None,
        property_name=m.unit.property.name if m.unit and m.unit.property else None,
    )


@router.put("/{request_id}", response_model=MaintenanceResponse)
async def update_maintenance_request(
    request_id: int,
    req_in: MaintenanceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """Update maintenance status, priority, or admin notes (Admin only)."""
    stmt = (
        select(MaintenanceRequest)
        .where(MaintenanceRequest.id == request_id, MaintenanceRequest.unit_id.in_(owned_unit_ids(current_user)))
        .options(
            selectinload(MaintenanceRequest.tenant),
            selectinload(MaintenanceRequest.unit).selectinload(Unit.property)
        )
    )
    result = await db.execute(stmt)
    m = result.scalar_one_or_none()

    if not m:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance request not found"
        )

    update_data = req_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(m, field, val)

    await db.commit()
    await db.refresh(m)

    return MaintenanceResponse(
        id=m.id,
        tenant_id=m.tenant_id,
        unit_id=m.unit_id,
        title=m.title,
        description=m.description,
        category=m.category,
        priority=m.priority,
        status=m.status,
        admin_notes=m.admin_notes,
        created_at=m.created_at,
        tenant_name=m.tenant.name if m.tenant else None,
        unit_number=m.unit.unit_number if m.unit else None,
        property_name=m.unit.property.name if m.unit and m.unit.property else None,
    )


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_maintenance_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> None:
    """Delete a maintenance request (Admin only)."""
    stmt = select(MaintenanceRequest).where(
        MaintenanceRequest.id == request_id, MaintenanceRequest.unit_id.in_(owned_unit_ids(current_user))
    )
    result = await db.execute(stmt)
    m = result.scalar_one_or_none()

    if not m:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance request not found"
        )

    await db.delete(m)
    await db.commit()

from datetime import date
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.tenant import Tenant
from app.models.unit import Unit
from app.models.user import User, UserRole
from app.schemas.payment import PaymentCreate, PaymentResponse, PaymentUpdate

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("", response_model=List[PaymentResponse])
async def list_payments(
    tenant_id: Optional[int] = Query(None),
    status_filter: Optional[PaymentStatus] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    List payment records:
    - Admin: can see all payments or filter by tenant/status.
    - Tenant: can only view payments associated with their tenant ID.
    """
    stmt = select(Payment).options(
        selectinload(Payment.tenant).selectinload(Tenant.unit).selectinload(Unit.property)
    ).order_by(desc(Payment.due_date))

    if current_user.role == UserRole.TENANT:
        if not current_user.tenant:
            return []
        stmt = stmt.where(Payment.tenant_id == current_user.tenant.id)
    else:
        if tenant_id is not None:
            stmt = stmt.where(Payment.tenant_id == tenant_id)
        if status_filter is not None:
            stmt = stmt.where(Payment.status == status_filter)

    result = await db.execute(stmt)
    payments = result.scalars().all()

    response = []
    for p in payments:
        t_name = p.tenant.name if p.tenant else None
        u_num = p.tenant.unit.unit_number if p.tenant and p.tenant.unit else None
        prop_name = (
            p.tenant.unit.property.name
            if p.tenant and p.tenant.unit and p.tenant.unit.property
            else None
        )

        response.append(
            PaymentResponse(
                id=p.id,
                tenant_id=p.tenant_id,
                amount=p.amount,
                due_date=p.due_date,
                paid_date=p.paid_date,
                status=p.status,
                payment_method=p.payment_method,
                reference_code=p.reference_code,
                notes=p.notes,
                created_at=p.created_at,
                tenant_name=t_name,
                unit_number=u_num,
                property_name=prop_name,
            )
        )
    return response


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_in: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """Record a new invoice or payment entry (Admin only)."""
    # Verify tenant exists
    tenant_stmt = (
        select(Tenant)
        .where(Tenant.id == payment_in.tenant_id)
        .options(selectinload(Tenant.unit).selectinload(Unit.property))
    )
    res = await db.execute(tenant_stmt)
    tenant = res.scalar_one_or_none()

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )

    payment = Payment(
        tenant_id=payment_in.tenant_id,
        amount=payment_in.amount,
        due_date=payment_in.due_date,
        paid_date=payment_in.paid_date,
        status=payment_in.status,
        payment_method=payment_in.payment_method,
        reference_code=payment_in.reference_code,
        notes=payment_in.notes,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    return PaymentResponse(
        id=payment.id,
        tenant_id=payment.tenant_id,
        amount=payment.amount,
        due_date=payment.due_date,
        paid_date=payment.paid_date,
        status=payment.status,
        payment_method=payment.payment_method,
        reference_code=payment.reference_code,
        notes=payment.notes,
        created_at=payment.created_at,
        tenant_name=tenant.name,
        unit_number=tenant.unit.unit_number if tenant.unit else None,
        property_name=tenant.unit.property.name if tenant.unit and tenant.unit.property else None,
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get payment details:
    - If tenant requests a payment not belonging to them: return HTTP 403 Forbidden.
    """
    stmt = (
        select(Payment)
        .where(Payment.id == payment_id)
        .options(
            selectinload(Payment.tenant).selectinload(Tenant.unit).selectinload(Unit.property)
        )
    )
    result = await db.execute(stmt)
    p = result.scalar_one_or_none()

    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment record not found"
        )

    # Enforce permission
    if current_user.role == UserRole.TENANT:
        if not current_user.tenant or p.tenant_id != current_user.tenant.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you do not have permission to view another tenant's payment"
            )

    t_name = p.tenant.name if p.tenant else None
    u_num = p.tenant.unit.unit_number if p.tenant and p.tenant.unit else None
    prop_name = (
        p.tenant.unit.property.name
        if p.tenant and p.tenant.unit and p.tenant.unit.property
        else None
    )

    return PaymentResponse(
        id=p.id,
        tenant_id=p.tenant_id,
        amount=p.amount,
        due_date=p.due_date,
        paid_date=p.paid_date,
        status=p.status,
        payment_method=p.payment_method,
        reference_code=p.reference_code,
        notes=p.notes,
        created_at=p.created_at,
        tenant_name=t_name,
        unit_number=u_num,
        property_name=prop_name,
    )


@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: int,
    payment_in: PaymentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """Update payment status or details (Admin only, e.g. mark paid)."""
    stmt = (
        select(Payment)
        .where(Payment.id == payment_id)
        .options(
            selectinload(Payment.tenant).selectinload(Tenant.unit).selectinload(Unit.property)
        )
    )
    result = await db.execute(stmt)
    p = result.scalar_one_or_none()

    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )

    update_data = payment_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(p, field, val)

    await db.commit()
    await db.refresh(p)

    t_name = p.tenant.name if p.tenant else None
    u_num = p.tenant.unit.unit_number if p.tenant and p.tenant.unit else None
    prop_name = (
        p.tenant.unit.property.name
        if p.tenant and p.tenant.unit and p.tenant.unit.property
        else None
    )

    return PaymentResponse(
        id=p.id,
        tenant_id=p.tenant_id,
        amount=p.amount,
        due_date=p.due_date,
        paid_date=p.paid_date,
        status=p.status,
        payment_method=p.payment_method,
        reference_code=p.reference_code,
        notes=p.notes,
        created_at=p.created_at,
        tenant_name=t_name,
        unit_number=u_num,
        property_name=prop_name,
    )


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> None:
    """Delete a payment record (Admin only)."""
    stmt = select(Payment).where(Payment.id == payment_id)
    result = await db.execute(stmt)
    p = result.scalar_one_or_none()

    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )

    await db.delete(p)
    await db.commit()

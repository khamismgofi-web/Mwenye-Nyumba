#!/usr/bin/env python3
"""
Seed script for Mwenye-Nyumba Property Management.
Populates realistic demo data for properties, units, tenants, payments, and maintenance requests.
Run with: python seed.py
"""

import asyncio
from datetime import date, datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, engine
from app.core.security import get_password_hash
from app.models.base import Base
from app.models.maintenance import MaintenancePriority, MaintenanceRequest, MaintenanceStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.property import Property
from app.models.tenant import Tenant
from app.models.unit import Unit, UnitStatus
from app.models.user import User, UserRole


async def seed_database():
    print("🌱 Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        print("👤 Creating Admin user...")
        admin_user = User(
            email="admin@mwenyenyumba.com",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        session.add(admin_user)
        await session.flush()

        print("🏢 Creating Properties...")
        prop1 = Property(
            name="Kilimani Heights",
            address="Argwings Kodhek Road, Kilimani, Nairobi",
            owner="Khamis Family Holdings",
            description="Modern 4-storey residential apartment building with high-speed elevator and secure gated access."
        )
        prop2 = Property(
            name="Mombasa Road Court",
            address="Near City Cabanas, Mombasa Road, Nairobi",
            owner="Khamis Family Holdings",
            description="Convenient commercial and residential court close to SGR terminal and JKI Airport."
        )
        prop3 = Property(
            name="Karen Green Villas",
            address="Ngong View Close, Karen, Nairobi",
            owner="Khamis Family Holdings",
            description="Luxury 4-bedroom townhouses with private landscaped gardens and solar water heating."
        )
        session.add_all([prop1, prop2, prop3])
        await session.flush()

        print("🚪 Creating Units...")
        # Kilimani Units
        u101 = Unit(property_id=prop1.id, unit_number="Apt 101", rent_amount=55000, status=UnitStatus.OCCUPIED, floor=1, bedrooms=2, bathrooms=2)
        u102 = Unit(property_id=prop1.id, unit_number="Apt 102", rent_amount=55000, status=UnitStatus.OCCUPIED, floor=1, bedrooms=2, bathrooms=2)
        u201 = Unit(property_id=prop1.id, unit_number="Apt 201", rent_amount=60000, status=UnitStatus.VACANT, floor=2, bedrooms=2, bathrooms=2)
        u202 = Unit(property_id=prop1.id, unit_number="Apt 202", rent_amount=75000, status=UnitStatus.VACANT, floor=2, bedrooms=3, bathrooms=2)
        
        # Mombasa Rd Units
        u_mb1 = Unit(property_id=prop2.id, unit_number="Unit B1", rent_amount=40000, status=UnitStatus.OCCUPIED, floor=1, bedrooms=1, bathrooms=1)
        u_mb2 = Unit(property_id=prop2.id, unit_number="Unit B2", rent_amount=40000, status=UnitStatus.VACANT, floor=1, bedrooms=1, bathrooms=1)
        u_mb3 = Unit(property_id=prop2.id, unit_number="Unit B3", rent_amount=48000, status=UnitStatus.VACANT, floor=2, bedrooms=2, bathrooms=1)

        # Karen Villas
        u_kv1 = Unit(property_id=prop3.id, unit_number="Villa #1", rent_amount=140000, status=UnitStatus.OCCUPIED, floor=1, bedrooms=4, bathrooms=4)
        u_kv2 = Unit(property_id=prop3.id, unit_number="Villa #2", rent_amount=140000, status=UnitStatus.VACANT, floor=1, bedrooms=4, bathrooms=4)

        session.add_all([u101, u102, u201, u202, u_mb1, u_mb2, u_mb3, u_kv1, u_kv2])
        await session.flush()

        print("👥 Creating Tenant accounts...")
        # Tenant 1: John Kamau (Apt 101 Kilimani)
        user_john = User(
            email="tenant.john@mwenyenyumba.com",
            hashed_password=get_password_hash("tenant123"),
            role=UserRole.TENANT,
            is_active=True,
        )
        session.add(user_john)
        await session.flush()
        t_john = Tenant(
            user_id=user_john.id,
            unit_id=u101.id,
            name="John Kamau",
            contact_info="+254 712 345 678",
            national_id="29481726",
            lease_start=date(2024, 1, 1),
            lease_end=date(2025, 12, 31),
        )
        session.add(t_john)

        # Tenant 2: Mary Wanjiku (Apt 102 Kilimani)
        user_mary = User(
            email="tenant.mary@mwenyenyumba.com",
            hashed_password=get_password_hash("tenant123"),
            role=UserRole.TENANT,
            is_active=True,
        )
        session.add(user_mary)
        await session.flush()
        t_mary = Tenant(
            user_id=user_mary.id,
            unit_id=u102.id,
            name="Mary Wanjiku",
            contact_info="+254 722 890 123",
            national_id="31829401",
            lease_start=date(2024, 3, 1),
            lease_end=date(2025, 2, 28),
        )
        session.add(t_mary)

        # Tenant 3: David Otieno (Unit B1 Mombasa Rd)
        user_david = User(
            email="tenant.david@mwenyenyumba.com",
            hashed_password=get_password_hash("tenant123"),
            role=UserRole.TENANT,
            is_active=True,
        )
        session.add(user_david)
        await session.flush()
        t_david = Tenant(
            user_id=user_david.id,
            unit_id=u_mb1.id,
            name="David Otieno",
            contact_info="+254 733 456 789",
            national_id="25194028",
            lease_start=date(2024, 6, 1),
            lease_end=date(2025, 5, 31),
        )
        session.add(t_david)

        # Tenant 4: Grace Achieng (Villa #1 Karen)
        user_grace = User(
            email="tenant.grace@mwenyenyumba.com",
            hashed_password=get_password_hash("tenant123"),
            role=UserRole.TENANT,
            is_active=True,
        )
        session.add(user_grace)
        await session.flush()
        t_grace = Tenant(
            user_id=user_grace.id,
            unit_id=u_kv1.id,
            name="Grace Achieng",
            contact_info="+254 799 112 233",
            national_id="27103948",
            lease_start=date(2023, 11, 1),
            lease_end=date(2025, 10, 31),
        )
        session.add(t_grace)
        await session.flush()

        print("💰 Creating Payment histories...")
        today = date.today()
        # John Kamau: Paid last month, Paid this month
        p1 = Payment(
            tenant_id=t_john.id,
            amount=55000,
            due_date=date(today.year, today.month if today.month > 1 else 12, 5),
            paid_date=date(today.year, today.month if today.month > 1 else 12, 3),
            status=PaymentStatus.PAID,
            payment_method=PaymentMethod.MPESA,
            reference_code="QK89X109LM",
            notes="Prompt rent payment via M-Pesa Paybill"
        )
        # Mary Wanjiku: Overdue payment for current month
        p2 = Payment(
            tenant_id=t_mary.id,
            amount=55000,
            due_date=date(today.year, today.month, 5) - timedelta(days=15),
            paid_date=None,
            status=PaymentStatus.OVERDUE,
            payment_method=PaymentMethod.MPESA,
            reference_code=None,
            notes="Reminder notice sent via SMS"
        )
        # David Otieno: Pending payment
        p3 = Payment(
            tenant_id=t_david.id,
            amount=40000,
            due_date=today + timedelta(days=5),
            paid_date=None,
            status=PaymentStatus.PENDING,
            payment_method=PaymentMethod.BANK_TRANSFER,
            reference_code=None,
            notes="Upcoming rent due on 5th"
        )
        # Grace Achieng: Paid on time via Bank Transfer
        p4 = Payment(
            tenant_id=t_grace.id,
            amount=140000,
            due_date=date(today.year, today.month, 1),
            paid_date=date(today.year, today.month, 1),
            status=PaymentStatus.PAID,
            payment_method=PaymentMethod.BANK_TRANSFER,
            reference_code="FT242309104",
            notes="Quarterly villa retainer confirmed"
        )
        session.add_all([p1, p2, p3, p4])

        print("🛠️ Creating Maintenance requests...")
        m1 = MaintenanceRequest(
            tenant_id=t_john.id,
            unit_id=u101.id,
            title="Kitchen sink pipe leak",
            description="The PVC drainage pipe under the kitchen sink has a steady drip causing moisture build-up inside the wooden cabinet.",
            category="Plumbing",
            priority=MaintenancePriority.HIGH,
            status=MaintenanceStatus.IN_PROGRESS,
            admin_notes="Plumber Juma dispatched on Tuesday morning."
        )
        m2 = MaintenanceRequest(
            tenant_id=t_mary.id,
            unit_id=u102.id,
            title="Master bedroom circuit breaker tripping",
            description="Whenever the water heater and bedroom air conditioning run simultaneously, the sub-board breaker trips.",
            category="Electrical",
            priority=MaintenancePriority.URGENT,
            status=MaintenanceStatus.PENDING,
            admin_notes="Electrician scheduled for inspection."
        )
        m3 = MaintenanceRequest(
            tenant_id=t_david.id,
            unit_id=u_mb1.id,
            title="Balcony door latch replacement",
            description="The sliding door latch on the balcony got jammed and cannot lock firmly.",
            category="Carpentry",
            priority=MaintenancePriority.LOW,
            status=MaintenanceStatus.COMPLETED,
            admin_notes="New lock mechanism installed on Friday."
        )
        session.add_all([m1, m2, m3])

        await session.commit()
        print("✅ Demo data seeded successfully!")
        print("\n--- CREDENTIALS FOR TESTING ---")
        print("🔑 Landlord / Admin:")
        print("   Email: admin@mwenyenyumba.com")
        print("   Password: admin123")
        print("\n🔑 Tenant accounts (password for all: tenant123):")
        print("   1. tenant.john@mwenyenyumba.com   (Kilimani Heights - Apt 101)")
        print("   2. tenant.mary@mwenyenyumba.com   (Kilimani Heights - Apt 102)")
        print("   3. tenant.david@mwenyenyumba.com  (Mombasa Road - Unit B1)")
        print("   4. tenant.grace@mwenyenyumba.com  (Karen Green - Villa #1)")
        print("--------------------------------\n")


if __name__ == "__main__":
    asyncio.run(seed_database())

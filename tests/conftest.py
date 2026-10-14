import os
import tempfile

_tmp = tempfile.mkdtemp()
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_tmp}/test.db"
os.environ["SECRET_KEY"] = "t" * 40

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.database import AsyncSessionLocal, engine
from app.core.ratelimit import login_by_account, login_by_ip, register_by_ip
from app.core.security import get_password_hash
from app.main import app
from app.models import Base, User, UserRole

ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "admin-password-123"


@pytest_asyncio.fixture(autouse=True)
async def fresh_database():
    for limiter in (login_by_account, login_by_ip, register_by_ip):
        limiter.clear()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        session.add(
            User(
                email=ADMIN_EMAIL,
                hashed_password=get_password_hash(ADMIN_PASSWORD),
                role=UserRole.ADMIN,
                is_active=True,
            )
        )
        await session.commit()
    yield


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def login(client, email, password):
    res = await client.post("/api/v1/auth/login-json", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest_asyncio.fixture
async def admin_headers(client):
    return await login(client, ADMIN_EMAIL, ADMIN_PASSWORD)


@pytest_asyncio.fixture
async def unit_id(client, admin_headers):
    prop = await client.post(
        "/api/v1/properties",
        json={"name": "Test Court", "address": "1 Test Road", "owner": "Owner"},
        headers=admin_headers,
    )
    assert prop.status_code == 201, prop.text
    unit = await client.post(
        "/api/v1/units",
        json={"property_id": prop.json()["id"], "unit_number": "A1", "rent_amount": 50000},
        headers=admin_headers,
    )
    assert unit.status_code == 201, unit.text
    return unit.json()["id"]

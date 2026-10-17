from datetime import date, timedelta

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.jobs import mark_overdue_payments
from app.models import Payment
from tests.conftest import ADMIN_EMAIL, ADMIN_PASSWORD
from tests.test_tenants_and_rbac import tenant_body

API = "/api/v1"


async def test_login_is_rate_limited_and_recovers_on_success(client):
    bad = {"email": ADMIN_EMAIL, "password": "wrong-password"}
    for _ in range(4):
        assert (await client.post(f"{API}/auth/login-json", json=bad)).status_code == 401
    ok = await client.post(f"{API}/auth/login-json", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert ok.status_code == 200
    for _ in range(5):
        assert (await client.post(f"{API}/auth/login-json", json=bad)).status_code == 401
    blocked = await client.post(f"{API}/auth/login-json", json=bad)
    assert blocked.status_code == 429 and "Retry-After" in blocked.headers
    still_blocked = await client.post(f"{API}/auth/login-json", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert still_blocked.status_code == 429
    other = await client.post(f"{API}/auth/login-json", json={"email": "someone@test.com", "password": "whatever123"})
    assert other.status_code == 401


async def test_registration_guessing_is_limited(client):
    body = {"email": "a@test.com", "password": "tenant-pass-123", "full_name": "A", "phone": "+2557000", "invite_code": "ZZZZZZZZ"}
    for _ in range(10):
        assert (await client.post(f"{API}/auth/register", json=body)).status_code == 400
    assert (await client.post(f"{API}/auth/register", json=body)).status_code == 429


async def test_money_is_exact(client, admin_headers, unit_id):
    tenant = await client.post(f"{API}/tenants", json=tenant_body(unit_id, "t1@test.com"), headers=admin_headers)
    tid = tenant.json()["id"]
    for _ in range(3):
        res = await client.post(
            f"{API}/payments", json={"tenant_id": tid, "amount": 100.10, "due_date": "2027-01-01"}, headers=admin_headers
        )
        assert res.status_code == 201, res.text
    tenants = await client.get(f"{API}/tenants", headers=admin_headers)
    assert tenants.json()[0]["balance_due"] == 300.3


async def test_overdue_job_flips_only_past_due_pending(client, admin_headers, unit_id):
    tenant = await client.post(f"{API}/tenants", json=tenant_body(unit_id, "t1@test.com"), headers=admin_headers)
    tid = tenant.json()["id"]
    past = (date.today() - timedelta(days=10)).isoformat()
    future = (date.today() + timedelta(days=10)).isoformat()
    ids = {}
    for name, due, status in [("late", past, "pending"), ("later", future, "pending"), ("done", past, "paid")]:
        res = await client.post(
            f"{API}/payments",
            json={"tenant_id": tid, "amount": 1000, "due_date": due, "status": status, "paid_date": past if status == "paid" else None},
            headers=admin_headers,
        )
        assert res.status_code == 201, res.text
        ids[name] = res.json()["id"]
    assert await mark_overdue_payments() == 1
    assert await mark_overdue_payments() == 0
    async with AsyncSessionLocal() as session:
        rows = {p.id: p.status.value for p in (await session.execute(select(Payment))).scalars()}
    assert rows[ids["late"]] == "overdue"
    assert rows[ids["later"]] == "pending"
    assert rows[ids["done"]] == "paid"


async def test_cron_endpoint_needs_the_secret(client, monkeypatch):
    from app.core import config

    assert (await client.get(f"{API}/internal/overdue")).status_code == 404
    monkeypatch.setattr(config.settings, "CRON_SECRET", "cron-secret-for-tests")
    assert (await client.get(f"{API}/internal/overdue")).status_code == 401
    assert (await client.get(f"{API}/internal/overdue", headers={"Authorization": "Bearer wrong"})).status_code == 401
    ok = await client.get(f"{API}/internal/overdue", headers={"Authorization": "Bearer cron-secret-for-tests"})
    assert ok.status_code == 200 and ok.json() == {"marked_overdue": 0}


def test_serverless_database_options_avoid_pooled_prepared_statements():
    from sqlalchemy.pool import NullPool

    from app.core.database import engine_options

    opts = engine_options("postgresql+asyncpg://u:p@host-pooler/db?ssl=require", serverless=True)
    assert opts["poolclass"] is NullPool
    assert opts["connect_args"]["statement_cache_size"] == 0
    assert opts["connect_args"]["prepared_statement_cache_size"] == 0
    names = {opts["connect_args"]["prepared_statement_name_func"]() for _ in range(3)}
    assert len(names) == 3
    normal = engine_options("postgresql+asyncpg://u:p@host/db", serverless=False)
    assert normal["pool_size"] == 5 and "poolclass" not in normal
    assert "check_same_thread" in engine_options("sqlite+aiosqlite:///x.db", serverless=True)["connect_args"]

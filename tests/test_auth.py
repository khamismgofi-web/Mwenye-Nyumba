from datetime import datetime, timedelta, timezone

from sqlalchemy import update

from app.core.database import AsyncSessionLocal
from app.core.security import create_refresh_token
from app.models import InviteCode
from tests.conftest import ADMIN_EMAIL, ADMIN_PASSWORD, login

API = "/api/v1"


def register_body(code, email="tenant@test.com", **extra):
    body = {
        "email": email,
        "password": "tenant-pass-123",
        "full_name": "Test Tenant",
        "phone": "+255700000000",
        "invite_code": code,
    }
    body.update(extra)
    return body


async def make_code(client, admin_headers, unit_id):
    res = await client.post(f"{API}/invite-codes", json={"unit_id": unit_id}, headers=admin_headers)
    assert res.status_code == 201, res.text
    return res.json()


async def test_login_success_and_failures(client):
    ok = await client.post(f"{API}/auth/login-json", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert ok.status_code == 200 and ok.json()["role"] == "admin"
    upper = await client.post(f"{API}/auth/login-json", json={"email": ADMIN_EMAIL.upper(), "password": ADMIN_PASSWORD})
    assert upper.status_code == 200
    bad = await client.post(f"{API}/auth/login-json", json={"email": ADMIN_EMAIL, "password": "wrong-password"})
    assert bad.status_code == 401
    unknown = await client.post(f"{API}/auth/login-json", json={"email": "nobody@test.com", "password": "whatever123"})
    assert unknown.status_code == 401


async def test_refresh_token_cannot_be_used_as_access_token(client):
    res = await client.post(f"{API}/auth/login-json", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    refresh = res.json()["refresh_token"]
    me = await client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {refresh}"})
    assert me.status_code == 401
    renewed = await client.post(f"{API}/auth/refresh", json={"refresh_token": refresh})
    assert renewed.status_code == 200
    access = res.json()["access_token"]
    misuse = await client.post(f"{API}/auth/refresh", json={"refresh_token": access})
    assert misuse.status_code == 401


async def test_invite_registration_flow(client, admin_headers, unit_id):
    invite = await make_code(client, admin_headers, unit_id)
    assert len(invite["code"]) == 8 and invite["used"] is False

    res = await client.post(f"{API}/auth/register", json=register_body(invite["code"].lower()))
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["role"] == "tenant" and data["unit_id"] == unit_id and data["tenant_id"]

    headers = {"Authorization": f"Bearer {data['access_token']}"}
    me = await client.get(f"{API}/tenants/me", headers=headers)
    assert me.status_code == 200 and me.json()["unit_id"] == unit_id

    units = await client.get(f"{API}/units/{unit_id}", headers=admin_headers)
    assert units.json()["status"] == "occupied"


async def test_invite_code_is_single_use(client, admin_headers, unit_id):
    invite = await make_code(client, admin_headers, unit_id)
    first = await client.post(f"{API}/auth/register", json=register_body(invite["code"]))
    assert first.status_code == 201
    second = await client.post(f"{API}/auth/register", json=register_body(invite["code"], email="other@test.com"))
    assert second.status_code == 400


async def test_expired_and_unknown_codes_rejected(client, admin_headers, unit_id):
    invite = await make_code(client, admin_headers, unit_id)
    async with AsyncSessionLocal() as session:
        await session.execute(
            update(InviteCode).values(expires_at=datetime.now(timezone.utc) - timedelta(days=1))
        )
        await session.commit()
    expired = await client.post(f"{API}/auth/register", json=register_body(invite["code"]))
    assert expired.status_code == 400
    unknown = await client.post(f"{API}/auth/register", json=register_body("ZZZZZZZZ"))
    assert unknown.status_code == 400
    assert expired.json()["detail"] == unknown.json()["detail"]


async def test_registration_cannot_create_admin(client, admin_headers, unit_id):
    invite = await make_code(client, admin_headers, unit_id)
    res = await client.post(f"{API}/auth/register", json=register_body(invite["code"], role="admin"))
    assert res.status_code == 201
    assert res.json()["role"] == "tenant"
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}
    forbidden = await client.get(f"{API}/properties", headers=headers)
    assert forbidden.status_code == 403


async def test_registration_validation(client, admin_headers, unit_id):
    invite = await make_code(client, admin_headers, unit_id)
    short = await client.post(f"{API}/auth/register", json=register_body(invite["code"], password="short"))
    assert short.status_code == 422
    missing = register_body(invite["code"])
    missing.pop("invite_code")
    assert (await client.post(f"{API}/auth/register", json=missing)).status_code == 422


async def test_duplicate_email_keeps_code_unused(client, admin_headers, unit_id):
    invite = await make_code(client, admin_headers, unit_id)
    dup = await client.post(f"{API}/auth/register", json=register_body(invite["code"], email=ADMIN_EMAIL))
    assert dup.status_code == 409
    retry = await client.post(f"{API}/auth/register", json=register_body(invite["code"]))
    assert retry.status_code == 201


async def test_cannot_issue_code_for_occupied_unit(client, admin_headers, unit_id):
    invite = await make_code(client, admin_headers, unit_id)
    await client.post(f"{API}/auth/register", json=register_body(invite["code"]))
    again = await client.post(f"{API}/invite-codes", json={"unit_id": unit_id}, headers=admin_headers)
    assert again.status_code == 409
    missing = await client.post(f"{API}/invite-codes", json={"unit_id": 9999}, headers=admin_headers)
    assert missing.status_code == 404


async def test_invite_endpoints_are_admin_only(client, admin_headers, unit_id):
    invite = await make_code(client, admin_headers, unit_id)
    reg = await client.post(f"{API}/auth/register", json=register_body(invite["code"]))
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}
    assert (await client.post(f"{API}/invite-codes", json={"unit_id": unit_id}, headers=headers)).status_code == 403
    assert (await client.get(f"{API}/invite-codes", headers=headers)).status_code == 403
    assert (await client.post(f"{API}/invite-codes", json={"unit_id": unit_id})).status_code == 401

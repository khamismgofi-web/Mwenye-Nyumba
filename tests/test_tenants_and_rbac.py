from tests.conftest import login

API = "/api/v1"


def tenant_body(unit_id, email, **extra):
    body = {
        "unit_id": unit_id,
        "name": "Tenant One",
        "contact_info": "+255711111111",
        "lease_start": "2026-01-01",
        "lease_end": "2027-01-01",
        "email": email,
        "password": "tenant-pass-123",
    }
    body.update(extra)
    return body


async def test_admin_create_tenant_requires_password(client, admin_headers, unit_id):
    body = tenant_body(unit_id, "t1@test.com")
    body.pop("password")
    res = await client.post(f"{API}/tenants", json=body, headers=admin_headers)
    assert res.status_code == 422


async def test_cannot_double_book_unit(client, admin_headers, unit_id):
    first = await client.post(f"{API}/tenants", json=tenant_body(unit_id, "t1@test.com"), headers=admin_headers)
    assert first.status_code == 201, first.text
    second = await client.post(f"{API}/tenants", json=tenant_body(unit_id, "t2@test.com"), headers=admin_headers)
    assert second.status_code == 409


async def test_tenant_isolation(client, admin_headers, unit_id):
    prop = (await client.get(f"{API}/properties", headers=admin_headers)).json()[0]
    unit2 = await client.post(
        f"{API}/units",
        json={"property_id": prop["id"], "unit_number": "A2", "rent_amount": 40000},
        headers=admin_headers,
    )
    unit2_id = unit2.json()["id"]
    t1 = await client.post(f"{API}/tenants", json=tenant_body(unit_id, "t1@test.com"), headers=admin_headers)
    t2 = await client.post(f"{API}/tenants", json=tenant_body(unit2_id, "t2@test.com"), headers=admin_headers)
    pay = await client.post(
        f"{API}/payments",
        json={"tenant_id": t2.json()["id"], "amount": 40000, "due_date": "2026-02-01"},
        headers=admin_headers,
    )
    h1 = await login(client, "t1@test.com", "tenant-pass-123")
    assert (await client.get(f"{API}/tenants/{t2.json()['id']}", headers=h1)).status_code == 403
    assert (await client.get(f"{API}/units/{unit2_id}", headers=h1)).status_code == 403
    assert (await client.get(f"{API}/payments/{pay.json()['id']}", headers=h1)).status_code == 403
    assert (await client.get(f"{API}/payments", headers=h1)).json() == []
    assert (await client.post(f"{API}/properties", json={"name": "x", "address": "y", "owner": "z"}, headers=h1)).status_code == 403
    assert (await client.put(f"{API}/payments/{pay.json()['id']}", json={"status": "paid"}, headers=h1)).status_code == 403
    assert t1.status_code == 201


async def test_cannot_delete_unit_or_property_with_tenant(client, admin_headers, unit_id):
    await client.post(f"{API}/tenants", json=tenant_body(unit_id, "t1@test.com"), headers=admin_headers)
    assert (await client.delete(f"{API}/units/{unit_id}", headers=admin_headers)).status_code == 409
    prop = (await client.get(f"{API}/properties", headers=admin_headers)).json()[0]
    assert (await client.delete(f"{API}/properties/{prop['id']}", headers=admin_headers)).status_code == 409


async def test_unauthenticated_requests_rejected(client):
    for path in ["properties", "units", "tenants", "payments", "maintenance", "auth/me"]:
        assert (await client.get(f"{API}/{path}")).status_code == 401, path


async def test_health_endpoints(client):
    assert (await client.get("/health")).status_code == 200
    assert (await client.get("/health/ready")).status_code == 200

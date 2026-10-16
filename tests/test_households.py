import pytest

from tests.conftest import SIGNUP_CODE, login, signup_landlord
from tests.test_tenants_and_rbac import tenant_body

API = "/api/v1"


async def build_household(client, headers):
    prop = (await client.post(f"{API}/properties", json={"name": "A Court", "address": "Mbeya", "owner": "A"}, headers=headers)).json()
    unit = (await client.post(f"{API}/units", json={"property_id": prop["id"], "unit_number": "1", "rent_amount": 100000}, headers=headers)).json()
    unit2 = (await client.post(f"{API}/units", json={"property_id": prop["id"], "unit_number": "2", "rent_amount": 90000}, headers=headers)).json()
    tenant = (await client.post(f"{API}/tenants", json=tenant_body(unit["id"], "tenant.a@test.com"), headers=headers)).json()
    payment = (
        await client.post(f"{API}/payments", json={"tenant_id": tenant["id"], "amount": 100000, "due_date": "2027-01-01"}, headers=headers)
    ).json()
    t_headers = await login(client, "tenant.a@test.com", "tenant-pass-123")
    repair = (
        await client.post(f"{API}/maintenance", json={"title": "Leak", "description": "Tap leaks", "category": "Plumbing", "priority": "high"}, headers=t_headers)
    ).json()
    invite = (await client.post(f"{API}/invite-codes", json={"unit_id": unit2["id"]}, headers=headers)).json()
    entry = (
        await client.post(f"{API}/entries", json={"property_id": prop["id"], "unit_id": unit["id"], "kind": "plan", "title": "Repaint", "amount": 500000}, headers=headers)
    ).json()
    return dict(prop=prop, unit=unit, unit2=unit2, tenant=tenant, payment=payment, repair=repair, invite=invite, entry=entry)


async def test_landlord_b_cannot_see_or_touch_anything_of_landlord_a(client, admin_headers):
    a = await build_household(client, admin_headers)
    b = await signup_landlord(client, "landlord.b@test.com")

    for path in ["properties", "units", "tenants", "payments", "maintenance", "invite-codes", "entries"]:
        res = await client.get(f"{API}/{path}", headers=b)
        assert res.status_code == 200 and res.json() == [], path

    p, u, t, pay, r, inv, e = (a[k] for k in ["prop", "unit", "tenant", "payment", "repair", "invite", "entry"])
    gone = [
        ("get", f"properties/{p['id']}", None),
        ("put", f"properties/{p['id']}", {"name": "hacked"}),
        ("delete", f"properties/{p['id']}", None),
        ("get", f"units/{u['id']}", None),
        ("put", f"units/{u['id']}", {"unit_number": "X"}),
        ("delete", f"units/{u['id']}", None),
        ("delete", f"units/{u['id']}/photo", None),
        ("get", f"tenants/{t['id']}", None),
        ("put", f"tenants/{t['id']}", {"name": "hacked"}),
        ("put", f"tenants/{t['id']}/password", {"password": "hacked-pass-1"}),
        ("delete", f"tenants/{t['id']}", None),
        ("get", f"payments/{pay['id']}", None),
        ("put", f"payments/{pay['id']}", {"status": "paid"}),
        ("delete", f"payments/{pay['id']}", None),
        ("get", f"maintenance/{r['id']}", None),
        ("put", f"maintenance/{r['id']}", {"status": "completed"}),
        ("delete", f"maintenance/{r['id']}", None),
        ("delete", f"invite-codes/{inv['id']}", None),
        ("put", f"entries/{e['id']}", {"title": "hacked"}),
        ("delete", f"entries/{e['id']}", None),
    ]
    for method, path, body in gone:
        res = await getattr(client, method)(f"{API}/{path}", headers=b, **({"json": body} if body is not None else {}))
        assert res.status_code == 404, f"{method.upper()} {path} -> {res.status_code} {res.text}"

    creates = [
        ("properties-none", None),
        ("units", {"property_id": p["id"], "unit_number": "Z", "rent_amount": 1}),
        ("tenants", tenant_body(a["unit2"]["id"], "intruder@test.com")),
        ("payments", {"tenant_id": t["id"], "amount": 5, "due_date": "2027-02-01"}),
        ("invite-codes", {"unit_id": a["unit2"]["id"]}),
        ("entries", {"property_id": p["id"], "kind": "note", "title": "hi"}),
        ("maintenance", {"title": "x", "description": "yyyyy", "unit_id": u["id"]}),
    ]
    for path, body in creates:
        if body is None:
            continue
        res = await client.post(f"{API}/{path}", json=body, headers=b)
        assert res.status_code in (400, 404), f"POST {path} -> {res.status_code}"

    again = await client.get(f"{API}/properties/{p['id']}", headers=admin_headers)
    assert again.status_code == 200 and again.json()["name"] == "A Court"
    assert (await client.get(f"{API}/units", headers=admin_headers)).json().__len__() == 2


async def test_each_landlord_sees_only_their_own_after_both_build(client, admin_headers):
    await build_household(client, admin_headers)
    b = await signup_landlord(client, "landlord.b@test.com")
    pb = (await client.post(f"{API}/properties", json={"name": "B Villas", "address": "Dar", "owner": "B"}, headers=b)).json()
    props_a = (await client.get(f"{API}/properties", headers=admin_headers)).json()
    props_b = (await client.get(f"{API}/properties", headers=b)).json()
    assert [p["name"] for p in props_a] == ["A Court"]
    assert [p["name"] for p in props_b] == ["B Villas"]
    assert pb["id"] != props_a[0]["id"]


async def test_tenant_belongs_to_the_landlord_who_invited_them(client, admin_headers):
    b = await signup_landlord(client, "landlord.b@test.com")
    pb = (await client.post(f"{API}/properties", json={"name": "B Villas", "address": "Dar", "owner": "B"}, headers=b)).json()
    ub = (await client.post(f"{API}/units", json={"property_id": pb["id"], "unit_number": "V1", "rent_amount": 70000}, headers=b)).json()
    invite = (await client.post(f"{API}/invite-codes", json={"unit_id": ub["id"]}, headers=b)).json()
    reg = await client.post(
        f"{API}/auth/register",
        json={"email": "t@b.com", "password": "tenant-pass-123", "full_name": "B Tenant", "phone": "+2557000000", "invite_code": invite["code"]},
    )
    assert reg.status_code == 201
    assert len((await client.get(f"{API}/tenants", headers=b)).json()) == 1
    assert (await client.get(f"{API}/tenants", headers=admin_headers)).json() == []


async def test_roles_are_separate(client, admin_headers, unit_id):
    await client.post(f"{API}/tenants", json=tenant_body(unit_id, "t1@test.com"), headers=admin_headers)
    t = await login(client, "t1@test.com", "tenant-pass-123")
    for method, path in [("get", "properties"), ("get", "invite-codes"), ("get", "entries"), ("get", "tenants/999")]:
        res = await getattr(client, method)(f"{API}/{path}", headers=t)
        assert res.status_code in (403, 404), (path, res.status_code)
    assert (await client.post(f"{API}/entries", json={"property_id": 1, "kind": "note", "title": "x"}, headers=t)).status_code == 403
    assert (await client.post(f"{API}/auth/register-landlord", json={"email": "x@test.com", "password": "long-password-1", "full_name": "X Y", "phone": "+255712000000", "signup_code": "nope"})).status_code == 403


async def test_landlord_signup_rules(client):
    body = {"email": "new@test.com", "password": "long-password-1", "full_name": "New Landlord", "phone": "+255712000000"}
    wrong = await client.post(f"{API}/auth/register-landlord", json={**body, "signup_code": "wrong-code"})
    assert wrong.status_code == 403
    ok = await client.post(f"{API}/auth/register-landlord", json={**body, "signup_code": SIGNUP_CODE})
    assert ok.status_code == 201 and ok.json()["role"] == "admin" and ok.json()["tenant_id"] is None
    dup = await client.post(f"{API}/auth/register-landlord", json={**body, "email": "NEW@test.com", "signup_code": SIGNUP_CODE})
    assert dup.status_code == 409
    bad_phone = await client.post(f"{API}/auth/register-landlord", json={**body, "email": "p@test.com", "phone": "0712000000", "signup_code": SIGNUP_CODE})
    assert bad_phone.status_code == 422
    short = await client.post(f"{API}/auth/register-landlord", json={**body, "email": "s@test.com", "password": "short", "signup_code": SIGNUP_CODE})
    assert short.status_code == 422


async def test_landlord_signup_code_guessing_is_limited(client):
    body = {"email": "g@test.com", "password": "long-password-1", "full_name": "Guesser", "phone": "+255712000000", "signup_code": "wrong"}
    for _ in range(5):
        assert (await client.post(f"{API}/auth/register-landlord", json=body)).status_code == 403
    assert (await client.post(f"{API}/auth/register-landlord", json=body)).status_code == 429
    right = await client.post(f"{API}/auth/register-landlord", json={**body, "signup_code": SIGNUP_CODE})
    assert right.status_code == 429


async def test_signup_closed_when_no_code_configured(client, monkeypatch):
    from app.core import config

    monkeypatch.setattr(config.settings, "LANDLORD_SIGNUP_CODE", None)
    res = await client.post(
        f"{API}/auth/register-landlord",
        json={"email": "z@test.com", "password": "long-password-1", "full_name": "Zed Zed", "phone": "+255712000000", "signup_code": SIGNUP_CODE},
    )
    assert res.status_code == 404
    cfg = (await client.get(f"{API}/auth/config")).json()
    assert cfg["landlord_signup_enabled"] is False


async def test_profile_and_password_changes(client, admin_headers, unit_id):
    me = await client.put(f"{API}/auth/me", json={"full_name": "Khamis Mgofi", "phone": "+255 754 000 111"}, headers=admin_headers)
    assert me.status_code == 200 and me.json()["phone"] == "+255 754 000 111"
    assert (await client.get(f"{API}/auth/me", headers=admin_headers)).json()["full_name"] == "Khamis Mgofi"
    wrong = await client.post(f"{API}/auth/change-password", json={"current_password": "nope-nope-1", "new_password": "brand-new-pass-1"}, headers=admin_headers)
    assert wrong.status_code == 400
    ok = await client.post(f"{API}/auth/change-password", json={"current_password": "admin-password-123", "new_password": "brand-new-pass-1"}, headers=admin_headers)
    assert ok.status_code == 204
    assert (await client.post(f"{API}/auth/login-json", json={"email": "admin@test.com", "password": "admin-password-123"})).status_code == 401
    assert (await client.post(f"{API}/auth/login-json", json={"email": "admin@test.com", "password": "brand-new-pass-1"})).status_code == 200


async def test_landlord_resets_tenant_password(client, admin_headers, unit_id):
    created = await client.post(f"{API}/tenants", json=tenant_body(unit_id, "t1@test.com"), headers=admin_headers)
    tid = created.json()["id"]
    assert (await client.put(f"{API}/tenants/{tid}/password", json={"password": "short"}, headers=admin_headers)).status_code == 422
    assert (await client.put(f"{API}/tenants/{tid}/password", json={"password": "reset-pass-123"}, headers=admin_headers)).status_code == 204
    assert (await client.post(f"{API}/auth/login-json", json={"email": "t1@test.com", "password": "tenant-pass-123"})).status_code == 401
    assert (await client.post(f"{API}/auth/login-json", json={"email": "t1@test.com", "password": "reset-pass-123"})).status_code == 200

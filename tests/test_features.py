import asyncio
import io

import boto3
from PIL import Image

from tests.conftest import SENT_EMAILS, SENT_SMS, login
from tests.test_tenants_and_rbac import tenant_body

API = "/api/v1"


def make_image(fmt="JPEG", size=(3000, 2000), color=(200, 40, 40)):
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format=fmt)
    return buf.getvalue()


async def property_id_of(client, headers):
    return (await client.get(f"{API}/properties", headers=headers)).json()[0]["id"]


async def test_notebook_plans_budget_and_expenses(client, admin_headers, unit_id):
    pid = await property_id_of(client, admin_headers)
    plan = await client.post(
        f"{API}/entries",
        json={"property_id": pid, "unit_id": unit_id, "kind": "plan", "title": "Repaint unit A1", "body": "Buy 3 buckets", "amount": 450000, "target_date": "2026-12-01"},
        headers=admin_headers,
    )
    assert plan.status_code == 201, plan.text
    assert plan.json()["done"] is False and plan.json()["amount"] == 450000
    expense = await client.post(
        f"{API}/entries",
        json={"property_id": pid, "unit_id": unit_id, "kind": "expense", "title": "Paint", "amount": 120500.5, "category": "Repairs"},
        headers=admin_headers,
    )
    assert expense.status_code == 201
    note = await client.post(f"{API}/entries", json={"property_id": pid, "kind": "note", "title": "Water bill due on 5th"}, headers=admin_headers)
    assert note.status_code == 201 and note.json()["unit_id"] is None

    no_amount = await client.post(f"{API}/entries", json={"property_id": pid, "kind": "expense", "title": "Mystery"}, headers=admin_headers)
    assert no_amount.status_code == 422
    bad_kind = await client.post(f"{API}/entries", json={"property_id": pid, "kind": "gossip", "title": "x"}, headers=admin_headers)
    assert bad_kind.status_code == 422
    negative = await client.post(f"{API}/entries", json={"property_id": pid, "kind": "expense", "title": "x", "amount": -5}, headers=admin_headers)
    assert negative.status_code == 422

    done = await client.put(f"{API}/entries/{plan.json()['id']}", json={"done": True}, headers=admin_headers)
    assert done.status_code == 200 and done.json()["done"] is True

    only_unit = (await client.get(f"{API}/entries?unit_id={unit_id}", headers=admin_headers)).json()
    assert {e["title"] for e in only_unit} == {"Repaint unit A1", "Paint"}
    only_expenses = (await client.get(f"{API}/entries?kind=expense", headers=admin_headers)).json()
    assert [e["amount"] for e in only_expenses] == [120500.5]

    assert (await client.delete(f"{API}/entries/{note.json()['id']}", headers=admin_headers)).status_code == 204
    assert len((await client.get(f"{API}/entries", headers=admin_headers)).json()) == 2


async def test_entry_unit_must_belong_to_property(client, admin_headers, unit_id):
    pid = await property_id_of(client, admin_headers)
    other = (await client.post(f"{API}/properties", json={"name": "Second", "address": "x", "owner": "o"}, headers=admin_headers)).json()
    res = await client.post(f"{API}/entries", json={"property_id": other["id"], "unit_id": unit_id, "kind": "note", "title": "mismatch"}, headers=admin_headers)
    assert res.status_code == 404
    assert pid != other["id"]


async def test_unit_photo_is_stored_in_bucket_not_database(client, admin_headers, unit_id):
    res = await client.post(f"{API}/units/{unit_id}/photo", files={"file": ("unit.jpg", make_image(), "image/jpeg")}, headers=admin_headers)
    assert res.status_code == 200, res.text
    url = res.json()["photo_url"]
    assert url and "127.0.0.1:5599" in url and "units/" in url

    s3 = boto3.client("s3", endpoint_url="http://127.0.0.1:5599", region_name="us-east-1", aws_access_key_id="testing", aws_secret_access_key="testing")
    keys = [o["Key"] for o in s3.list_objects_v2(Bucket="unit-photos").get("Contents", [])]
    assert len(keys) == 1 and keys[0].startswith(f"units/{unit_id}/")
    stored = Image.open(io.BytesIO(s3.get_object(Bucket="unit-photos", Key=keys[0])["Body"].read()))
    assert max(stored.size) == 1600 and stored.format == "JPEG"

    from sqlalchemy import select
    from app.core.database import AsyncSessionLocal
    from app.models import Unit

    async with AsyncSessionLocal() as session:
        key = (await session.execute(select(Unit.photo_key))).scalar_one()
    assert key == keys[0]

    replaced = await client.post(f"{API}/units/{unit_id}/photo", files={"file": ("b.png", make_image("PNG", (800, 600)), "image/png")}, headers=admin_headers)
    assert replaced.status_code == 200
    keys2 = [o["Key"] for o in s3.list_objects_v2(Bucket="unit-photos").get("Contents", [])]
    assert len(keys2) == 1 and keys2[0] != keys[0]

    listed = (await client.get(f"{API}/units", headers=admin_headers)).json()
    assert listed[0]["photo_url"]

    removed = await client.delete(f"{API}/units/{unit_id}/photo", headers=admin_headers)
    assert removed.status_code == 200 and removed.json()["photo_url"] is None
    assert s3.list_objects_v2(Bucket="unit-photos").get("KeyCount", 0) == 0


async def test_photo_rejects_bad_files_and_strips_location_data(client, admin_headers, unit_id):
    junk = await client.post(f"{API}/units/{unit_id}/photo", files={"file": ("x.jpg", b"not an image at all", "image/jpeg")}, headers=admin_headers)
    assert junk.status_code == 422
    gif_buf = io.BytesIO()
    Image.new("RGB", (50, 50)).save(gif_buf, format="GIF")
    gif = await client.post(f"{API}/units/{unit_id}/photo", files={"file": ("x.gif", gif_buf.getvalue(), "image/gif")}, headers=admin_headers)
    assert gif.status_code == 422
    huge = await client.post(f"{API}/units/{unit_id}/photo", files={"file": ("x.jpg", b"0" * (9 * 1024 * 1024), "image/jpeg")}, headers=admin_headers)
    assert huge.status_code == 413

    exif = Image.Exif()
    exif[0x8825] = {1: "S", 2: (6.0, 49.0, 0.0), 3: "E", 4: (35.0, 0.0, 0.0)}
    buf = io.BytesIO()
    Image.new("RGB", (400, 300)).save(buf, format="JPEG", exif=exif)
    assert Image.open(io.BytesIO(buf.getvalue())).getexif().get(0x8825)
    ok = await client.post(f"{API}/units/{unit_id}/photo", files={"file": ("gps.jpg", buf.getvalue(), "image/jpeg")}, headers=admin_headers)
    assert ok.status_code == 200
    s3 = boto3.client("s3", endpoint_url="http://127.0.0.1:5599", region_name="us-east-1", aws_access_key_id="testing", aws_secret_access_key="testing")
    key = s3.list_objects_v2(Bucket="unit-photos")["Contents"][0]["Key"]
    stored = Image.open(io.BytesIO(s3.get_object(Bucket="unit-photos", Key=key)["Body"].read()))
    assert not stored.getexif().get(0x8825)


async def test_tenant_sees_unit_photo_but_cannot_change_it(client, admin_headers, unit_id):
    await client.post(f"{API}/units/{unit_id}/photo", files={"file": ("unit.jpg", make_image(size=(800, 600)), "image/jpeg")}, headers=admin_headers)
    await client.post(f"{API}/tenants", json=tenant_body(unit_id, "t1@test.com"), headers=admin_headers)
    t = await login(client, "t1@test.com", "tenant-pass-123")
    units = (await client.get(f"{API}/units", headers=t)).json()
    assert units[0]["photo_url"]
    assert (await client.post(f"{API}/units/{unit_id}/photo", files={"file": ("x.jpg", make_image(size=(100, 100)), "image/jpeg")}, headers=t)).status_code == 403
    assert (await client.delete(f"{API}/units/{unit_id}/photo", headers=t)).status_code == 403


async def test_deleting_unit_removes_its_photo(client, admin_headers, unit_id):
    await client.post(f"{API}/units/{unit_id}/photo", files={"file": ("unit.jpg", make_image(size=(800, 600)), "image/jpeg")}, headers=admin_headers)
    assert (await client.delete(f"{API}/units/{unit_id}", headers=admin_headers)).status_code == 204
    s3 = boto3.client("s3", endpoint_url="http://127.0.0.1:5599", region_name="us-east-1", aws_access_key_id="testing", aws_secret_access_key="testing")
    assert s3.list_objects_v2(Bucket="unit-photos").get("KeyCount", 0) == 0


async def wait_for(predicate, seconds=5):
    for _ in range(int(seconds * 20)):
        if predicate():
            return True
        await asyncio.sleep(0.05)
    return False


async def test_tenant_repair_report_reaches_landlord_by_email_and_sms(client, admin_headers, unit_id):
    await client.post(f"{API}/tenants", json=tenant_body(unit_id, "t1@test.com", name="Amina Juma", contact_info="+255700111222"), headers=admin_headers)
    t = await login(client, "t1@test.com", "tenant-pass-123")
    res = await client.post(
        f"{API}/maintenance",
        json={"title": "Kitchen tap leaking", "description": "Water is dripping under the sink since morning", "category": "Plumbing", "priority": "urgent"},
        headers=t,
    )
    assert res.status_code == 201, res.text
    assert await wait_for(lambda: len(SENT_EMAILS) == 1), "email was not delivered"
    assert await wait_for(lambda: len(SENT_SMS) == 1), "sms was not sent"

    env = SENT_EMAILS[0]
    assert env.rcpt_tos == ["admin@test.com"]
    import email
    from email import policy

    parsed = email.message_from_bytes(env.content, policy=policy.default)
    assert parsed["Subject"].strip() == "URGENT: Message from tenant: Amina Juma, unit A1 (Kitchen tap leaking)"
    assert parsed["From"] == "alerts@mwenye.test"
    content = parsed.get_content()
    assert content.startswith("MESSAGE FROM TENANT")
    assert "Water is dripping under the sink since morning" in content
    assert "+255700111222" in content
    assert "https://app.test/#/admin/repairs" in content

    sms = SENT_SMS[0]
    assert sms["api_key"] == "at-key"
    assert sms["form"]["to"] == "+255712345678" and sms["form"]["username"] == "sandbox"
    assert sms["form"]["message"].startswith("Message from tenant: Amina Juma, unit A1 Test Court.")
    assert "Kitchen tap leaking" in sms["form"]["message"]


async def test_alerts_only_go_to_the_owning_landlord(client, admin_headers, unit_id):
    from tests.conftest import signup_landlord

    await signup_landlord(client, "other.landlord@test.com", phone="+255799999999")
    await client.post(f"{API}/tenants", json=tenant_body(unit_id, "t1@test.com"), headers=admin_headers)
    t = await login(client, "t1@test.com", "tenant-pass-123")
    await client.post(f"{API}/maintenance", json={"title": "Window", "description": "Window will not close", "category": "General", "priority": "low"}, headers=t)
    assert await wait_for(lambda: len(SENT_EMAILS) == 1)
    await asyncio.sleep(0.3)
    assert [e.rcpt_tos for e in SENT_EMAILS] == [["admin@test.com"]]
    assert [s["form"]["to"] for s in SENT_SMS] == ["+255712345678"]


async def test_report_still_saved_when_email_and_sms_fail(client, admin_headers, unit_id, monkeypatch):
    from app.core import config

    monkeypatch.setattr(config.settings, "SMTP_PORT", 1)
    monkeypatch.setattr(config.settings, "AT_BASE_URL", "http://127.0.0.1:1/none")
    await client.post(f"{API}/tenants", json=tenant_body(unit_id, "t1@test.com"), headers=admin_headers)
    t = await login(client, "t1@test.com", "tenant-pass-123")
    res = await client.post(f"{API}/maintenance", json={"title": "Door", "description": "Door lock is stuck", "category": "General", "priority": "medium"}, headers=t)
    assert res.status_code == 201
    await asyncio.sleep(0.5)
    mine = (await client.get(f"{API}/maintenance", headers=admin_headers)).json()
    assert [m["title"] for m in mine] == ["Door"]


async def test_landlord_created_ticket_does_not_alert(client, admin_headers, unit_id):
    await client.post(f"{API}/tenants", json=tenant_body(unit_id, "t1@test.com"), headers=admin_headers)
    res = await client.post(f"{API}/maintenance", json={"title": "Roof", "description": "Check the roof", "category": "General", "priority": "low", "unit_id": unit_id}, headers=admin_headers)
    assert res.status_code == 201
    await asyncio.sleep(0.4)
    assert SENT_EMAILS == [] and SENT_SMS == []


async def test_photo_endpoint_reports_clearly_when_storage_missing(client, admin_headers, unit_id, monkeypatch):
    from app.core import config

    monkeypatch.setattr(config.settings, "S3_BUCKET", None)
    res = await client.post(f"{API}/units/{unit_id}/photo", files={"file": ("x.jpg", make_image(size=(100, 100)), "image/jpeg")}, headers=admin_headers)
    assert res.status_code == 503
    assert (await client.get(f"{API}/units", headers=admin_headers)).json()[0]["photo_url"] is None

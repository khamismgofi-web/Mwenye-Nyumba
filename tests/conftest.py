import os
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs

_tmp = tempfile.mkdtemp()
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_tmp}/test.db"
os.environ["SECRET_KEY"] = "t" * 40
os.environ["LANDLORD_SIGNUP_CODE"] = "launch-code-for-tests"
os.environ["PUBLIC_APP_URL"] = "https://app.test"

from moto.server import ThreadedMotoServer

_moto = ThreadedMotoServer(port=5599, verbose=False)
_moto.start()
os.environ.update(
    S3_BUCKET="unit-photos",
    S3_ENDPOINT_URL="http://127.0.0.1:5599",
    S3_REGION="us-east-1",
    S3_ACCESS_KEY_ID="testing",
    S3_SECRET_ACCESS_KEY="testing",
)

from aiosmtpd.controller import Controller

SENT_EMAILS: list = []


class _Handler:
    async def handle_DATA(self, server, session, envelope):
        SENT_EMAILS.append(envelope)
        return "250 OK"


_smtp = Controller(_Handler(), hostname="127.0.0.1", port=8026)
_smtp.start()
os.environ.update(SMTP_HOST="127.0.0.1", SMTP_PORT="8026", SMTP_FROM="alerts@mwenye.test", SMTP_STARTTLS="false")

SENT_SMS: list = []


class _SmsHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = parse_qs(self.rfile.read(length).decode())
        SENT_SMS.append({"form": {k: v[0] for k, v in body.items()}, "api_key": self.headers.get("apiKey")})
        self.send_response(201)
        self.end_headers()
        self.wfile.write(b"{}")

    def log_message(self, *args):
        return


_sms_server = HTTPServer(("127.0.0.1", 8027), _SmsHandler)
threading.Thread(target=_sms_server.serve_forever, daemon=True).start()
os.environ.update(AT_USERNAME="sandbox", AT_API_KEY="at-key", AT_BASE_URL="http://127.0.0.1:8027/messaging")

import boto3
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

boto3.client(
    "s3", endpoint_url="http://127.0.0.1:5599", region_name="us-east-1",
    aws_access_key_id="testing", aws_secret_access_key="testing",
).create_bucket(Bucket="unit-photos")

from app.core.database import AsyncSessionLocal, engine
from app.core.ratelimit import landlord_signup_by_ip, login_by_account, login_by_ip, register_by_ip
from app.main import app
from app.core.security import get_password_hash
from app.models import Base, User, UserRole

SIGNUP_CODE = "launch-code-for-tests"
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "admin-password-123"


@pytest_asyncio.fixture(autouse=True)
async def fresh_database():
    for limiter in (login_by_account, login_by_ip, register_by_ip, landlord_signup_by_ip):
        limiter.clear()
    SENT_EMAILS.clear()
    SENT_SMS.clear()
    _bucket = boto3.client(
        "s3", endpoint_url="http://127.0.0.1:5599", region_name="us-east-1",
        aws_access_key_id="testing", aws_secret_access_key="testing",
    )
    for obj in _bucket.list_objects_v2(Bucket="unit-photos").get("Contents", []):
        _bucket.delete_object(Bucket="unit-photos", Key=obj["Key"])
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
                full_name="Primary Landlord",
                phone="+255712345678",
            )
        )
        await session.commit()
    yield


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def signup_landlord(client, email, name="Landlord One", phone="+255712000000", password="landlord-pass-123"):
    res = await client.post(
        "/api/v1/auth/register-landlord",
        json={"email": email, "password": password, "full_name": name, "phone": phone, "signup_code": SIGNUP_CODE},
    )
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


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

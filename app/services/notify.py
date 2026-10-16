import asyncio
import logging
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

SMS_LIMIT = 300


@dataclass
class RepairAlert:
    landlord_email: str
    landlord_phone: Optional[str]
    tenant_name: str
    tenant_phone: Optional[str]
    unit_number: str
    property_name: str
    title: str
    description: str
    category: Optional[str]
    priority: str


def build_email(alert: RepairAlert) -> tuple[str, str]:
    urgent = "URGENT: " if alert.priority in ("urgent", "high") else ""
    subject = f"{urgent}Message from tenant: {alert.tenant_name}, unit {alert.unit_number} ({alert.title})"
    lines = [
        "MESSAGE FROM TENANT",
        "",
        f"From: {alert.tenant_name}" + (f" ({alert.tenant_phone})" if alert.tenant_phone else ""),
        f"Unit: {alert.unit_number}, {alert.property_name}",
        f"Topic: {alert.title}" + (f" ({alert.category}, priority {alert.priority})" if alert.category else f" (priority {alert.priority})"),
        "",
        "Message:",
        alert.description,
        "",
        f"Open it in Mwenye Nyumba: {settings.PUBLIC_APP_URL.rstrip('/')}/#/admin/repairs",
    ]
    return subject, "\n".join(lines)


def build_sms(alert: RepairAlert) -> str:
    text = (
        f"Message from tenant: {alert.tenant_name}, unit {alert.unit_number} {alert.property_name}. "
        f"{alert.title}: {alert.description}"
    )
    if alert.tenant_phone:
        text += f" Call {alert.tenant_phone}."
    return text if len(text) <= SMS_LIMIT else text[: SMS_LIMIT - 3] + "..."


def _send_email_blocking(to: str, subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        if settings.SMTP_STARTTLS:
            server.starttls()
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD or "")
        server.send_message(msg)


async def send_email(to: str, subject: str, body: str) -> bool:
    if not settings.email_enabled:
        return False
    try:
        await asyncio.to_thread(_send_email_blocking, to, subject, body)
        return True
    except Exception:
        logger.exception("Email to %s failed", to)
        return False


async def send_sms(phone: str, text: str) -> bool:
    if not settings.sms_enabled:
        return False
    number = phone.strip().replace(" ", "")
    if not number.startswith("+"):
        logger.warning("SMS skipped: phone number must start with + and the country code")
        return False
    data = {"username": settings.AT_USERNAME, "to": number, "message": text}
    if settings.AT_SENDER_ID:
        data["from"] = settings.AT_SENDER_ID
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.post(
                settings.AT_BASE_URL,
                data=data,
                headers={"apiKey": settings.AT_API_KEY, "Accept": "application/json"},
            )
        if res.status_code >= 300:
            logger.error("SMS provider returned %s: %s", res.status_code, res.text[:200])
            return False
        return True
    except Exception:
        logger.exception("SMS to %s failed", number)
        return False


async def notify_landlord_of_repair(alert: RepairAlert) -> None:
    subject, body = build_email(alert)
    await send_email(alert.landlord_email, subject, body)
    if alert.landlord_phone:
        await send_sms(alert.landlord_phone, build_sms(alert))

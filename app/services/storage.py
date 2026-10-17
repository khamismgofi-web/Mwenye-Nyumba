import asyncio
import io
import uuid
from functools import lru_cache
from typing import Optional

import boto3
from botocore.config import Config
from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.config import settings

MAX_UPLOAD_BYTES = 4 * 1024 * 1024
MAX_SIDE = 1600
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}

Image.MAX_IMAGE_PIXELS = 40_000_000


class StorageNotConfigured(Exception):
    pass


class InvalidImage(Exception):
    pass


@lru_cache
def _client():
    if not settings.storage_enabled:
        raise StorageNotConfigured()
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL or None,
        region_name=settings.S3_REGION,
        aws_access_key_id=settings.S3_ACCESS_KEY_ID,
        aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )


def clear_client_cache() -> None:
    _client.cache_clear()


def process_image(raw: bytes) -> bytes:
    try:
        with Image.open(io.BytesIO(raw)) as img:
            if img.format not in ALLOWED_FORMATS:
                raise InvalidImage("Use a JPEG, PNG or WebP photo")
            img = ImageOps.exif_transpose(img)
            img = img.convert("RGB")
            img.thumbnail((MAX_SIDE, MAX_SIDE))
            out = io.BytesIO()
            img.save(out, format="JPEG", quality=82, optimize=True)
            return out.getvalue()
    except InvalidImage:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, ValueError):
        raise InvalidImage("That file is not a readable photo")


def _put(key: str, data: bytes) -> None:
    _client().put_object(Bucket=settings.S3_BUCKET, Key=key, Body=data, ContentType="image/jpeg", CacheControl="private, max-age=31536000")


def _delete(key: str) -> None:
    _client().delete_object(Bucket=settings.S3_BUCKET, Key=key)


async def save_unit_photo(unit_id: int, raw: bytes) -> str:
    data = await asyncio.to_thread(process_image, raw)
    key = f"units/{unit_id}/{uuid.uuid4().hex}.jpg"
    await asyncio.to_thread(_put, key, data)
    return key


async def delete_photo(key: Optional[str]) -> None:
    if not key or not settings.storage_enabled:
        return
    try:
        await asyncio.to_thread(_delete, key)
    except Exception:
        import logging

        logging.getLogger(__name__).exception("Could not delete photo %s", key)


def photo_url(key: Optional[str]) -> Optional[str]:
    if not key or not settings.storage_enabled:
        return None
    return _client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": key},
        ExpiresIn=settings.PHOTO_URL_EXPIRE_SECONDS,
    )

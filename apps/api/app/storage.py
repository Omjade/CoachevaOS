import logging
import uuid
from pathlib import Path

import boto3
from fastapi import UploadFile

from app.config import settings

logger = logging.getLogger(__name__)

UPLOAD_ROOT = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_ROOT.mkdir(exist_ok=True)

_s3_client = None


def _get_s3_client():
    global _s3_client
    if not settings.s3_bucket:
        return None
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id or None,
            aws_secret_access_key=settings.aws_secret_access_key or None,
        )
    return _s3_client


def _s3_key(key: str) -> str:
    prefix = settings.s3_prefix.strip("/")
    return f"{prefix}/{key}" if prefix else key


def classify_type(filename: str, content_type: str | None) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext in {"jpg", "jpeg", "png", "gif", "webp"} or (content_type or "").startswith("image/"):
        return "image"
    if ext == "pdf" or content_type == "application/pdf":
        return "pdf"
    if ext in {"mp4", "mov", "webm"} or (content_type or "").startswith("video/"):
        return "video"
    if ext in {"mp3", "wav", "m4a", "ogg"} or (content_type or "").startswith("audio/"):
        return "voice"
    return "file"


async def save_upload(file: UploadFile) -> tuple[str, str]:
    """Saves an uploaded file to S3 if configured (S3_BUCKET set), else local disk.
    Returns (storage_key, detected_type). The storage_key is provider-agnostic —
    callers never need to know which backend handled it."""
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin"
    key = f"{uuid.uuid4()}.{ext}"
    content = await file.read()
    file_type = classify_type(file.filename or "", file.content_type)

    client = _get_s3_client()
    if client is not None:
        try:
            client.put_object(
                Bucket=settings.s3_bucket,
                Key=_s3_key(key),
                Body=content,
                ContentType=file.content_type or "application/octet-stream",
            )
            return key, file_type
        except Exception:
            logger.exception("S3 upload failed, falling back to local disk for this file")

    (UPLOAD_ROOT / key).write_bytes(content)
    return key, file_type


def resolve_path(key: str) -> Path:
    """Local-disk-only resolver — raises if the file isn't stored locally
    (e.g. it's in S3). Use `open_file` for a backend-agnostic reader."""
    path = (UPLOAD_ROOT / key).resolve()
    if UPLOAD_ROOT.resolve() not in path.parents:
        raise ValueError("Invalid storage key")
    return path


async def read_file(key: str) -> bytes | None:
    """Reads file content regardless of backend. Returns None if not found anywhere."""
    client = _get_s3_client()
    if client is not None:
        try:
            obj = client.get_object(Bucket=settings.s3_bucket, Key=_s3_key(key))
            return obj["Body"].read()
        except Exception:
            pass

    try:
        path = resolve_path(key)
    except ValueError:
        return None
    if path.exists():
        return path.read_bytes()
    return None

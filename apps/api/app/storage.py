import io
import logging
import uuid
from pathlib import Path

import boto3
from fastapi import UploadFile
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)

# Long-edge cap for any uploaded image — a phone camera photo (often 3000px+)
# was being stored and served at full resolution everywhere it appeared
# (chat thumbnails, client grid cards, profile photos), the single biggest
# per-request byte-size contributor to "images load slowly." 1920px is
# already larger than any on-screen use in this app renders at.
MAX_IMAGE_DIMENSION = 1920
# 85+ is the generally-accepted "visually indistinguishable from the
# original" floor for JPEG re-encoding — chosen deliberately over a more
# aggressive value so compression never trades away visible quality for
# extra byte savings.
JPEG_QUALITY = 85

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


def _compress_image(content: bytes, ext: str, content_type: str | None) -> tuple[bytes, str, str]:
    """Downscales anything larger than MAX_IMAGE_DIMENSION and re-encodes at
    JPEG_QUALITY. Returns the original bytes/ext/content_type unchanged on
    any failure, or for formats where re-encoding would lose real behavior
    (animated GIFs would be flattened to their first frame). Never raises —
    an upload must still succeed even if compression can't run."""
    if ext.lower() == "gif":
        return content, ext, content_type or "image/gif"
    try:
        img = Image.open(io.BytesIO(content))
        img.load()
        has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
        if max(img.size) > MAX_IMAGE_DIMENSION:
            img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.LANCZOS)

        buf = io.BytesIO()
        if has_alpha:
            img.convert("RGBA").save(buf, format="PNG", optimize=True)
            return buf.getvalue(), "png", "image/png"
        img.convert("RGB").save(buf, format="JPEG", quality=JPEG_QUALITY, optimize=True)
        return buf.getvalue(), "jpg", "image/jpeg"
    except Exception:
        logger.exception("Image compression failed, storing original file unchanged")
        return content, ext, content_type


async def save_upload(file: UploadFile) -> tuple[str, str]:
    """Saves an uploaded file to S3 if configured (S3_BUCKET set), else local disk.
    Returns (storage_key, detected_type). The storage_key is provider-agnostic —
    callers never need to know which backend handled it."""
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin"
    content = await file.read()
    content_type = file.content_type
    file_type = classify_type(file.filename or "", file.content_type)

    if file_type == "image":
        content, ext, content_type = _compress_image(content, ext, content_type)

    key = f"{uuid.uuid4()}.{ext}"

    client = _get_s3_client()
    if client is not None:
        try:
            client.put_object(
                Bucket=settings.s3_bucket,
                Key=_s3_key(key),
                Body=content,
                ContentType=content_type or "application/octet-stream",
                # Every key is a fresh uuid4 — never overwritten — so this is
                # safe to cache aggressively/immutably. Previously unset
                # entirely, meaning every re-fetch (page nav, React remount)
                # was a full network round-trip with nothing to fall back on.
                CacheControl="public, max-age=31536000, immutable",
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


def get_presigned_url(
    key: str, expires_in: int = 900, content_disposition: str | None = None
) -> str | None:
    """A short-lived (default 15 min) direct-to-S3 GET URL — lets the browser
    fetch the object straight from S3/CloudFront instead of round-tripping
    through this backend (save_upload/read_file's proxy path), which was the
    real, sitewide root cause of "images take time to load" (every avatar,
    gallery image, document, progress photo). Returns None when S3 isn't
    configured (local-disk dev) or on any presigning error — callers must
    fall back to the existing proxy-read path in that case, never treat a
    None as an error."""
    client = _get_s3_client()
    if client is None:
        return None
    try:
        params = {"Bucket": settings.s3_bucket, "Key": _s3_key(key)}
        if content_disposition:
            params["ResponseContentDisposition"] = content_disposition
        return client.generate_presigned_url("get_object", Params=params, ExpiresIn=expires_in)
    except Exception:
        logger.exception("Failed to presign S3 URL, falling back to proxied read")
        return None


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

"""Paddle webhook signature verification — HMAC-SHA256 over the RAW request
body, per developer.paddle.com/webhooks/signature-verification. The header is
`Paddle-Signature: ts=<unix>;h1=<hex>`; the signed payload is exactly
f"{ts}:{raw_body}" (unparsed, unmodified body bytes)."""

import hashlib
import hmac


def verify_signature(raw_body: bytes, header: str | None, secret: str) -> bool:
    if not header or not secret:
        return False
    parts: dict[str, str] = {}
    for segment in header.split(";"):
        if "=" not in segment:
            continue
        key, _, value = segment.partition("=")
        parts[key.strip()] = value.strip()

    timestamp = parts.get("ts")
    signature = parts.get("h1")
    if not timestamp or not signature:
        return False

    signed_payload = f"{timestamp}:".encode() + raw_body
    computed = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed, signature)

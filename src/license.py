"""
ObsidiTube — License Key System
================================
Stateless HMAC-based license key issuance and validation.

Key format:  {prefix}_{order_id}.{hmac_sha256(secret, prefix_order_id)[:32]}

  prefix    = "ls"  (LemonSqueezy) | "np" (NOWPayments)
  order_id  = platform-specific order / payment ID
  hmac part = first 32 hex chars of HMAC-SHA256

Example:  ls_12345.a3f7c2b8d1e94f0a...

Validation is fully **stateless** — no database required.
The secret is the LICENSE_HMAC_SECRET env var. Guard it carefully.
"""

import hmac
import hashlib
import os

FREE_TIER_LIMIT = 10  # max videos without a valid license key

def _get_secret() -> bytes:
    """Load the HMAC secret from environment. Raises clearly if missing."""
    secret = os.getenv("LICENSE_HMAC_SECRET", "")
    if not secret:
        raise EnvironmentError(
            "LICENSE_HMAC_SECRET env var is not set. "
            "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
        )
    return secret.encode()


def make_license_key(prefix: str, order_id: str) -> str:
    """
    Generate a license key for a completed order.

    Args:
        prefix:   "ls" for LemonSqueezy, "np" for NOWPayments
        order_id: The platform's unique order/payment identifier

    Returns:
        A string like "ls_12345.a3f7c2b8d1e94f0a..."
    """
    payload = f"{prefix}_{order_id}"
    sig = hmac.new(
        _get_secret(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()[:32]
    return f"{payload}.{sig}"


def verify_license_key(key: str) -> bool:
    """
    Verify a license key without a database lookup.

    Returns True if the key was issued by this server (valid HMAC),
    False for any invalid / malformed / tampered key.
    """
    if not key or "." not in key:
        return False
    try:
        payload, sig = key.rsplit(".", 1)
        expected_sig = hmac.new(
            _get_secret(),
            payload.encode(),
            hashlib.sha256,
        ).hexdigest()[:32]
        # Use constant-time comparison to prevent timing attacks
        return hmac.compare_digest(sig, expected_sig)
    except Exception:
        return False

"""
Your ObsidiTube Pro License
============================
Securely verify and process payment notifications from Creem.io and NOWPayments.
"""

import hmac
import hashlib
import json
import os
import secrets
import requests
from typing import Dict, Any, Optional

def verify_creem_signature(payload: bytes, signature: str) -> bool:
    """Verifies HMAC-SHA256 signature from Creem.io."""
    secret = os.getenv("CREEM_WEBHOOK_SECRET", "")
    if not secret or not signature:
        return False
    
    computed_sig = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(computed_sig, signature)


def verify_nowpayments_signature(payload_dict: Dict[str, Any], signature: str) -> bool:
    """Verifies HMAC-SHA512 signature from NOWPayments."""
    secret = os.getenv("NOWPAYMENTS_IPN_SECRET", "")
    if not secret or not signature:
        return False

    # 1. Sort dictionary by keys alphabetically
    sorted_data = dict(sorted(payload_dict.items()))
    
    # 2. Convert to compact JSON (no spaces)
    json_string = json.dumps(sorted_data, separators=(',', ':'), sort_keys=True)
    
    # 3. Calculate HMAC-SHA512
    computed_sig = hmac.new(
        secret.encode('utf-8'),
        json_string.encode('utf-8'),
        hashlib.sha512
    ).hexdigest()
    
    return hmac.compare_digest(computed_sig, signature)


def generate_license_key() -> str:
    """Generate a secure, random license key."""
    # Format: OT-XXXX-XXXX-XXXX
    return f"OT-{''.join(secrets.token_hex(2).upper() for _ in range(3))}"


def provision_license(email: str, order_id: str, platform: str) -> str:
    """
    Generate a new license key and store it in Upstash KV.
    Returns the generated key.
    """
    license_key = generate_license_key()
    
    url = os.getenv("KV_REST_API_URL", "")
    token = os.getenv("KV_REST_API_TOKEN", "")
    
    if not url or not token:
        print(f"CRITICAL: KV config missing. Could not store license for {email}")
        return license_key # Still return it so it can be emailed/shown

    data = {
        "status": "active",
        "email": email,
        "id": f"{platform}_{order_id}",
        "created_at": requests.get("https://worldtimeapi.org/api/timezone/Etc/UTC").json().get("datetime", "")
    }
    
    try:
        # SET license:{key} JSON_STRING
        requests.post(
            f"{url}/set/license:{license_key}",
            headers={"Authorization": f"Bearer {token}"},
            data=json.dumps(data),
            timeout=5
        )
        print(f"Provisioned license {license_key} for {email}")
    except Exception as e:
        print(f"Error storing license in KV: {e}")
        
    return license_key


def send_license_email(email: str, license_key: str):
    """Send the license key via Resend."""
    api_key = os.getenv("RESEND_API_KEY")
    from_email = os.getenv("RESEND_FROM", "noreply@giblok.com")
    
    if not api_key:
        print("RESEND_API_KEY missing. Skipping email.")
        return

    html_content = f"""
    <h1>Your ObsidiTube Pro License</h1>
    <p>Thank you for your purchase!</p>
    <p>Your license key is: <strong>{license_key}</strong></p>
    <p>Enter this key in the ObsidiTube dashboard to unlock unlimited playlist conversions.</p>
    <br/>
    <p>Cheers,<br/>GiBlok Team</p>
    """

    try:
        requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "from": from_email,
                "to": email,
                "subject": "Your ObsidiTube Pro License Key",
                "html": html_content
            },
            timeout=5
        )
    except Exception as e:
        print(f"Error sending email via Resend: {e}")

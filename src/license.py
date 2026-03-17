"""
ObsidiTube — License Key System (Upstash KV / Redis Edition)
============================================================
Stateful license key validation using Upstash KV.

Keys are stored in Redis:
  Key:   "license:{license_key}"
  Value: { "status": "active", "email": "user@example.com", "id": "creem_order_id" }

Validation is done via Upstash REST API for serverless / edge compatibility.
"""

import os
import requests
import json
from typing import Optional, Dict, Any

FREE_TIER_LIMIT = 10  # max videos without a valid license key

def _get_kv_config() -> tuple[str, str]:
    """Load Upstash KV REST configuration from environment."""
    url = os.getenv("KV_REST_API_URL", "")
    token = os.getenv("KV_REST_API_TOKEN", "")
    if not url or not token:
        # Fallback to local dev if not set (but in prod this will fail)
        return "", ""
    return url, token


def verify_license_key(key: str) -> bool:
    """
    Verify a license key against Upstash KV store.

    Returns True if the key exists and its status is 'active'.
    """
    if not key or len(key) < 8:
        return False
    
    url, token = _get_kv_config()
    if not url:
        # If no KV is configured, we can't validate (deny access)
        print("Warning: KV_REST_API_URL not set. Denying license validation.")
        return False

    try:
        # GET license:{key} from Redis
        # Using the REST API: GET /get/license:key
        response = requests.get(
            f"{url}/get/license:{key}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5
        )
        
        if response.status_code != 200:
            return False
            
        result = response.json()
        # Upstash returns {"result": "JSON_STRING"} for GET
        data_str = result.get("result")
        
        if not data_str:
            return False
            
        data = json.loads(data_str)
        return data.get("status") == "active"
        
    except Exception as e:
        print(f"Error validating license key: {e}")
        return False


def get_license_data(key: str) -> Optional[Dict[str, Any]]:
    """Fetch full metadata for a license key."""
    url, token = _get_kv_config()
    if not url or not key:
        return None

    try:
        response = requests.get(
            f"{url}/get/license:{key}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5
        )
        if response.status_code == 200:
            result = response.json()
            data_str = result.get("result")
            if data_str:
                return json.loads(data_str)
    except Exception:
        pass
    return None

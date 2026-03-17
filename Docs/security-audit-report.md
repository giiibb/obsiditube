# Security and Privacy Audit Report: feature/paywall

**Date:** March 17, 2026  
**Status:** Complete

---

### 1. Hardcoded Creem API Key
*   **Vulnerability:** Hardcoded API Key
*   **Vulnerability Type:** Security
*   **Severity:** Critical
*   **Source Location:** `.env.example`, lines 2-2
*   **Line Content:** `CREEM_API_KEY=creem_1sKVxlzqyyUzBZFoF7bYII`
*   **Description:** A live Creem API key is present in the example environment file. If this file is committed to a public repository, the key could be compromised, allowing attackers to access the associated Creem account and potentially manipulate payments or access customer data.
*   **Recommendation:** Replace the live key with a placeholder value (e.g., `creem_...`) and ensure the actual key is only stored in secure, ignored environment files or secret managers.

---

### 2. Potential Path Traversal in License Validation
*   **Vulnerability:** Path Traversal
*   **Vulnerability Type:** Security
*   **Severity:** High
*   **Source Location:** `src/license.py` (lines 48-49) and `frontend/src/app/api/convert/route.ts` (line 37)
*   **Line Content (Python):** `response = requests.get(f"{url}/get/license:{key}", ...)`
*   **Line Content (TypeScript):** `const res = await fetch(\`${url}/get/license:${key}\`, ...)`
*   **Description:** The user-provided license key is concatenated directly into the REST API URL for Upstash KV in both the Python and TypeScript backends. If an attacker provides a key containing path traversal characters (e.g., `../`), they could potentially manipulate the API request to access other keys in the database.
*   **Recommendation:** Sanitize the `key` input to allow only expected characters (e.g., alphanumeric and hyphens) and URL-encode it using `urllib.parse.quote` (Python) or `encodeURIComponent` (TypeScript) before including it in the URL.

---

### 3. PII (Email) Leakage in Logs
*   **Vulnerability:** Privacy Violation
*   **Vulnerability Type:** Privacy
*   **Severity:** Medium
*   **Source Location:** `src/webhooks.py` (line 87) and `frontend/src/app/api/webhooks/creem/route.ts` (line 57)
*   **Data Type:** Email Address
*   **Line Content (Python):** `print(f"Provisioned license {license_key} for {email}")`
*   **Line Content (TypeScript):** `console.log(\`[Webhook] Provisioned ${licenseKey} for ${email}\`);`
*   **Description:** The application logs the full email address of the user during license provisioning in both the Python and TypeScript webhook handlers. This can lead to the exposure of Personally Identifiable Information (PII) in log files or monitoring systems.
*   **Recommendation:** Redact the email address in log statements (e.g., `user@example.com` -> `u***@example.com`) or avoid logging it entirely.

---

### 4. Plaintext License Key in LocalStorage
*   **Vulnerability:** Insecure Storage
*   **Vulnerability Type:** Security
*   **Severity:** Low
*   **Source Location:** `frontend/src/components/LicenseContext.tsx`, lines 32-32
*   **Line Content:** `localStorage.setItem("obsiditube_license_key", key);`
*   **Description:** The Pro license key is stored in plaintext in the browser's `localStorage`. While not as sensitive as a password, it is a paid asset that could be extracted by a malicious script if an XSS vulnerability existed, or by another user with access to the same computer.
*   **Recommendation:** Encrypt or obfuscate the license key before storing it in `localStorage`, or consider using a more secure storage mechanism such as an HTTP-only session cookie.

---

**Audit Summary:** The audit identified 1 critical, 1 high, 1 medium, and 1 low severity issue. Addressing these findings will significantly improve the security and privacy posture of the ObsidiTube paywall feature.

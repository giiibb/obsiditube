"""
ObsidiTube — HTTP Session Configuration
=========================================
Creates and configures a requests.Session that mimics a real browser request
to YouTube, bypassing:
  - EU cookie consent walls (SOCS / CONSENT cookies)
  - Basic bot-detection (modern User-Agent, realistic headers)

IMPORTANT: We deliberately omit "br" (Brotli) from Accept-Encoding because
the `requests` library cannot decode Brotli natively. Without this, YouTube
would send a compressed binary response that our parser can't read.
Use Accept-Encoding: gzip, deflate — both are handled transparently by requests.
"""

import os
from requests import Session

# Chrome 131 desktop UA — close enough to current that YouTube doesn't flag it.
USER_AGENT: str = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)

# These cookies bypass YouTube's EU consent screen and bot-detection gates.
# SOCS: Google's consent cookie (encodes "accept all" for EU users).
# CONSENT: legacy fallback consent value.
CONSENT_COOKIES: str = (
    "SOCS=CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjMwODI5LjA3X3AxGgJlbiACGgYIgJnSmgY; "
    "CONSENT=PENDING+987"
)


def change_dir_to_root():
    """Change the working directory to the project root (parent of src/)."""
    basedir = os.path.dirname(os.path.abspath(__file__))
    root = os.path.join(basedir, "..")
    os.chdir(root)


def create_session(cached: bool = False, cookies: str | None = None) -> Session:
    """
    Build a requests Session pre-configured for YouTube scraping.

    Args:
        cached: If True, wraps the session in a file-based HTTP cache
                (FileCacheBackend). Useful for CLI usage to avoid re-fetching.
                The API endpoint always uses cached=False for fresh data.
        cookies: Optional raw cookie header string from the user's browser.
                 Appended after the consent cookies to allow private playlist
                 access. Format: "key1=val1; key2=val2; ..."

    Returns:
        A fully configured requests.Session ready to make YouTube requests.
    """
    if not cached:
        session = Session()
    else:
        # Optional caching layer for repeated CLI invocations (saves bandwidth).
        from cached_requests import CacheSession, CacheConfig
        from cached_requests.backend import FileCacheBackend
        from datetime import timedelta

        config = CacheConfig(
            cache_backend=FileCacheBackend(cache_dir=".http_cache"),
            refresh_after=timedelta(days=1),
        )
        session = CacheSession(config=config)

    # Always inject consent cookies first; append user cookies after.
    all_cookies = CONSENT_COOKIES
    if cookies:
        all_cookies = f"{all_cookies}; {cookies}"

    # Headers that mimic a real Chrome desktop browser.
    # NOTE: Do NOT add "br" to Accept-Encoding — requests can't decode Brotli.
    session.headers.update(
        {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate",  # NO "br" — see module docstring
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Sec-Ch-Ua": '"Chromium";v="131", "Not_A Brand";v="24"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Cookie": all_cookies,
        }
    )
    return session

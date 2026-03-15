import os
from requests import Session

USER_AGENT: str = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)

# These cookies bypass YouTube's EU consent screen and bot-detection gates.
CONSENT_COOKIES: str = "SOCS=CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjMwODI5LjA3X3AxGgJlbiACGgYIgJnSmgY; CONSENT=PENDING+987"


def change_dir_to_root():
    basedir = os.path.dirname(os.path.abspath(__file__))
    root = os.path.join(basedir, "..")
    os.chdir(root)


def create_session(cached: bool = False, cookies: str | None = None) -> Session:
    if not cached:
        session = Session()
    else:
        from cached_requests import CacheSession, CacheConfig
        from cached_requests.backend import FileCacheBackend
        from datetime import timedelta

        config = CacheConfig(
            cache_backend=FileCacheBackend(cache_dir=".http_cache"),
            refresh_after=timedelta(days=1),
        )
        session = CacheSession(config=config)

    # Merge consent cookies with any user-provided cookies
    all_cookies = CONSENT_COOKIES
    if cookies:
        all_cookies = f"{all_cookies}; {cookies}"

    session.headers.update(
        {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
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

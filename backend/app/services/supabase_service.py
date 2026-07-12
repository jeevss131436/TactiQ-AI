"""Optional Supabase (Postgres) client + low-level, match-keyed cache helpers.

Caching is entirely optional. If SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are
not set (or the `supabase` package isn't installed), `is_enabled()` is False and
every helper here becomes a safe no-op — the app keeps working with zero setup
and falls back to computing on every request (see cache_service.py).

The backend writes with the service-role key, which bypasses row-level security.
The public tables only grant read access to anon clients, so all writes must go
through here.

Every helper swallows its own errors and returns a "miss"/False on failure: a
caching problem must never break an API response — worst case we recompute.
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Any, Optional

try:  # supabase is an optional dependency; absence just disables caching.
    from supabase import Client, create_client
except ImportError:  # pragma: no cover
    Client = Any  # type: ignore
    create_client = None  # type: ignore


@lru_cache(maxsize=1)
def _get_client() -> Optional["Client"]:
    """Lazily builds a single service-role client, or None if unconfigured.

    Read lazily (not at import) so `load_dotenv()` in main.py has already
    populated the environment by the time this first runs.
    """
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key or create_client is None:
        return None
    try:
        return create_client(url, key)
    except Exception:
        return None


def is_enabled() -> bool:
    return _get_client() is not None


def select_one(table: str, match_id: int) -> Optional[dict]:
    """The single row for a match (PK/uniquely match-keyed tables), or None."""
    client = _get_client()
    if client is None:
        return None
    try:
        res = client.table(table).select("*").eq("match_id", match_id).limit(1).execute()
        rows = res.data or []
        return rows[0] if rows else None
    except Exception:
        return None


def select_many(table: str, match_id: int) -> Optional[list[dict]]:
    """All rows for a match, or None on error. An empty list means a real
    cache miss (nothing stored yet), so callers can treat falsy as "recompute".
    """
    client = _get_client()
    if client is None:
        return None
    try:
        res = client.table(table).select("*").eq("match_id", match_id).execute()
        return res.data or []
    except Exception:
        return None


def upsert(table: str, rows: Any) -> bool:
    """Insert-or-update on the table's primary key. `rows` may be one dict or a
    list of dicts. Returns True on success.
    """
    client = _get_client()
    if client is None:
        return False
    try:
        client.table(table).upsert(rows).execute()
        return True
    except Exception:
        return False


def replace_match_rows(table: str, match_id: int, rows: list[dict]) -> bool:
    """Idempotently replace every row for a match: delete-then-insert. Used for
    the multi-row tables (player_match_stats, match_team_stats) whose natural
    key isn't the surrogate primary key, so a plain upsert can't target it.
    """
    client = _get_client()
    if client is None:
        return False
    try:
        client.table(table).delete().eq("match_id", match_id).execute()
        if rows:
            client.table(table).insert(rows).execute()
        return True
    except Exception:
        return False

"""Cache for computed analytics + LLM output, keyed by match_id.

This is a plain JSON-file cache — good enough for Day 1. The feature spec
calls for Supabase (Postgres) as the eventual cache/store; this module is
the swap point when that lands — callers only see get/save, not the
storage mechanism.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "cache"


def _cache_path(match_id: int) -> Path:
    return CACHE_DIR / f"{match_id}.json"


def get_cached_analytics(match_id: int) -> Optional[dict]:
    path = _cache_path(match_id)
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_cached_analytics(match_id: int, analytics: dict) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    with open(_cache_path(match_id), "w", encoding="utf-8") as f:
        json.dump(analytics, f, indent=2)

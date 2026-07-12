"""Cache for computed analytics + LLM output + the derived visualization
payloads (players, passing networks, shots, timeline), keyed by match_id.

When Supabase is configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY), reads
and writes go to Postgres — a cache hit skips both the expensive Claude call and
the pandas event-parsing that every endpoint would otherwise redo. When it isn't
configured, the analytics cache falls back to the original JSON-file store and
the other endpoints simply recompute, so the app still runs with zero setup.

Every write is best-effort: a caching failure is logged-and-swallowed so it can
never break the API response that triggered it.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from app.services import statsbomb_service, supabase_service

CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "cache"


# ---------------------------------------------------------------------------
# Reference-table backfill. The cache tables all FK to `matches`, which in turn
# FKs to `teams` (and optionally `competitions`), so those parent rows must
# exist before any cache row can be written. We derive them from the cheap
# in-memory match summary (never from the multi-MB events file).
# ---------------------------------------------------------------------------
def _ensure_match(match_id: int) -> Optional[dict]:
    """Upsert the competition/teams/match reference rows for a match and return
    its summary (or None if it can't be resolved / Supabase is off)."""
    if not supabase_service.is_enabled():
        return None
    try:
        summary = statsbomb_service.get_match_summary(match_id)
    except Exception:
        return None

    home, away = summary["home_team"], summary["away_team"]
    supabase_service.upsert(
        "teams",
        [
            {"team_id": home["team_id"], "team_name": home["team_name"]},
            {"team_id": away["team_id"], "team_name": away["team_name"]},
        ],
    )

    competition_id = summary.get("competition_id")
    season_id = summary.get("season_id")
    has_competition = False
    if (
        competition_id is not None
        and season_id is not None
        and summary.get("competition_name")
        and summary.get("season_name")
    ):
        has_competition = supabase_service.upsert(
            "competitions",
            {
                "competition_id": competition_id,
                "season_id": season_id,
                "competition_name": summary["competition_name"],
                "season_name": summary["season_name"],
                "country_name": summary.get("country_name"),
            },
        )

    match_row = {
        "match_id": match_id,
        "match_date": summary.get("match_date"),
        "kick_off": summary.get("kick_off"),
        "competition_stage": summary.get("competition_stage"),
        "home_team_id": home["team_id"],
        "away_team_id": away["team_id"],
        "home_score": summary.get("home_score", 0),
        "away_score": summary.get("away_score", 0),
    }
    # competition_id/season_id FK is nullable — only set it once the parent
    # competition row is guaranteed to exist, else the insert would fail.
    if has_competition:
        match_row["competition_id"] = competition_id
        match_row["season_id"] = season_id
    supabase_service.upsert("matches", match_row)
    return summary


def _cache_path(match_id: int) -> Path:
    return CACHE_DIR / f"{match_id}.json"


# ---------------------------------------------------------------------------
# Analytics + AI evaluation (the biggest win — a hit skips the Claude call).
# ---------------------------------------------------------------------------
def get_cached_analytics(match_id: int) -> Optional[dict]:
    if supabase_service.is_enabled():
        row = supabase_service.select_one("match_analytics", match_id)
        if row is None:
            return None
        try:
            match = statsbomb_service.get_match_summary(match_id)
        except Exception:
            match = None
        return {
            "match": match,
            "team_stats": row["team_stats"],
            "ai_evaluation": row["ai_evaluation"],
            "generated_at": row["generated_at"],
            "cached": True,
        }

    path = _cache_path(match_id)
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_cached_analytics(match_id: int, analytics: dict) -> None:
    if supabase_service.is_enabled():
        try:
            _ensure_match(match_id)
            supabase_service.upsert(
                "match_analytics",
                {
                    "match_id": match_id,
                    "team_stats": analytics["team_stats"],
                    "ai_evaluation": analytics["ai_evaluation"],
                    "model": analytics.get("model"),
                    "generated_at": analytics["generated_at"],
                },
            )
            _save_team_stats(match_id, analytics.get("match"), analytics["team_stats"])
        except Exception:
            pass
        return

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    with open(_cache_path(match_id), "w", encoding="utf-8") as f:
        json.dump(analytics, f, indent=2)


def _save_team_stats(match_id: int, match: Optional[dict], team_stats: dict) -> None:
    """Best-effort backfill of the normalized per-team stats table from the
    same aggregated blob stored on match_analytics."""
    if not match:
        return
    name_to_team = {
        match["home_team"]["team_name"]: (match["home_team"]["team_id"], "home"),
        match["away_team"]["team_name"]: (match["away_team"]["team_id"], "away"),
    }
    rows = []
    for team_name, s in team_stats.items():
        if team_name not in name_to_team:
            continue
        team_id, home_or_away = name_to_team[team_name]
        zone = s.get("zone_passing_pct", {}) or {}
        rows.append(
            {
                "match_id": match_id,
                "team_id": team_id,
                "home_or_away": home_or_away,
                "possession_pct": s.get("possession_pct"),
                "total_xg": s.get("total_xg"),
                "total_shots": s.get("total_shots"),
                "touches": s.get("touches"),
                "passes": s.get("passes"),
                "duels_won": s.get("duels_won"),
                "zone_defensive_third": zone.get("defensive_third"),
                "zone_middle_third": zone.get("middle_third"),
                "zone_attacking_third": zone.get("attacking_third"),
                "pressures": s.get("pressures"),
                "pressure_regain_pct": s.get("pressure_regain_pct"),
            }
        )
    supabase_service.replace_match_rows("match_team_stats", match_id, rows)


# ---------------------------------------------------------------------------
# Per-player stat lines (normalized into player_match_stats).
# ---------------------------------------------------------------------------
def get_cached_players(match_id: int) -> Optional[list[dict]]:
    if not supabase_service.is_enabled():
        return None
    rows = supabase_service.select_many("player_match_stats", match_id)
    if not rows:
        return None
    return [_row_to_player(r) for r in rows]


def _row_to_player(r: dict) -> dict:
    return {
        "player_id": r["player_id"],
        "name": r["name"],
        "team_name": r["team_name"],
        "home_or_away": r["home_or_away"],
        "position": r["position"],
        "shirt_number": r["shirt_number"],
        "is_starter": r["is_starter"],
        "minutes_played": r["minutes_played"],
        "stats": {
            "goals": r["goals"],
            "assists": r["assists"],
            "passes": r["passes"],
            "pass_accuracy": r["pass_accuracy"],
            "xg": r["xg"],
            "xa": r["xa"],
            "touches": r["touches"],
            "tackles": r["tackles"],
            "dribbles": r["dribbles"],
        },
        "average_position": r["average_position"],
        "touch_locations": r["touch_locations"] or [],
    }


def save_cached_players(match_id: int, players: list[dict]) -> None:
    if not supabase_service.is_enabled():
        return
    try:
        summary = _ensure_match(match_id)
        home_or_away_to_id = {}
        if summary:
            home_or_away_to_id = {
                "home": summary["home_team"]["team_id"],
                "away": summary["away_team"]["team_id"],
            }
        rows = []
        for p in players:
            s = p["stats"]
            rows.append(
                {
                    "match_id": match_id,
                    "player_id": p["player_id"],
                    "name": p["name"],
                    "team_id": home_or_away_to_id.get(p["home_or_away"]),
                    "team_name": p["team_name"],
                    "home_or_away": p["home_or_away"],
                    "position": p.get("position"),
                    "shirt_number": p.get("shirt_number"),
                    "is_starter": p.get("is_starter", False),
                    "minutes_played": p.get("minutes_played", 0),
                    "goals": s["goals"],
                    "assists": s["assists"],
                    "passes": s["passes"],
                    "pass_accuracy": s["pass_accuracy"],
                    "xg": s["xg"],
                    "xa": s["xa"],
                    "touches": s["touches"],
                    "tackles": s["tackles"],
                    "dribbles": s["dribbles"],
                    "average_position": p.get("average_position"),
                    "touch_locations": p.get("touch_locations", []),
                }
            )
        supabase_service.replace_match_rows("player_match_stats", match_id, rows)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Whole-payload JSON caches: passing networks, shots, timeline. Each is a
# single row holding the endpoint's exact `response` list under `data`.
# ---------------------------------------------------------------------------
def _get_json_cache(table: str, match_id: int) -> Optional[list]:
    if not supabase_service.is_enabled():
        return None
    row = supabase_service.select_one(table, match_id)
    return row["data"] if row else None


def _save_json_cache(table: str, match_id: int, data: list) -> None:
    if not supabase_service.is_enabled():
        return
    try:
        _ensure_match(match_id)
        supabase_service.upsert(table, {"match_id": match_id, "data": data})
    except Exception:
        pass


def get_cached_passing_network(match_id: int) -> Optional[list]:
    return _get_json_cache("match_passing_networks", match_id)


def save_cached_passing_network(match_id: int, data: list) -> None:
    _save_json_cache("match_passing_networks", match_id, data)


def get_cached_shots(match_id: int) -> Optional[list]:
    return _get_json_cache("match_shots", match_id)


def save_cached_shots(match_id: int, data: list) -> None:
    _save_json_cache("match_shots", match_id, data)


def get_cached_timeline(match_id: int) -> Optional[list]:
    return _get_json_cache("match_timeline", match_id)


def save_cached_timeline(match_id: int, data: list) -> None:
    _save_json_cache("match_timeline", match_id, data)

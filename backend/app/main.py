"""FastAPI entry point for Match Analytics AI.

Endpoints:
  GET /api/competitions
  GET /api/matches/{competition_id}/{season_id}
  GET /api/matches/search?q=...
  GET /api/match/{match_id}
  GET /api/analytics/{match_id}
  GET /api/players/{match_id}
  GET /api/passing-network/{match_id}
  GET /api/shots/{match_id}
  GET /api/timeline/{match_id}

Responses use an api-football-style envelope (get/parameters/errors/
results/paging/response) for a familiar REST shape. StatsBomb Open Data
remains the only real data source — see services/statsbomb_service.py.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.services import cache_service, llm_service, statsbomb_service

load_dotenv()

app = FastAPI(title="Match Analytics AI", version="0.1.0")


def _allowed_origins() -> list[str]:
    """Frontend origins allowed to call this API. Local dev is always allowed;
    add the deployed frontend URL(s) in production via ALLOWED_ORIGINS
    (comma-separated), e.g. "https://tactiq.vercel.app".
    """
    origins = {"http://localhost:3000"}
    for origin in os.environ.get("ALLOWED_ORIGINS", "").split(","):
        origin = origin.strip().rstrip("/")
        if origin:
            origins.add(origin)
    return sorted(origins)


app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    # Also match Vercel preview deployments (changing subdomains) when set,
    # e.g. ALLOWED_ORIGIN_REGEX="https://.*\\.vercel\\.app".
    allow_origin_regex=os.environ.get("ALLOWED_ORIGIN_REGEX") or None,
    allow_methods=["GET"],
    allow_headers=["*"],
)


def envelope(get: str, parameters: dict, response: list[Any]) -> dict:
    return {
        "get": get,
        "parameters": parameters,
        "errors": [],
        "results": len(response),
        "paging": {"current": 1, "total": 1},
        "response": response,
    }


@app.get("/api/competitions")
def list_competitions():
    competitions = statsbomb_service.get_competitions()
    return envelope("competitions", {}, competitions)


@app.get("/api/matches/search")
def search_matches(q: str = Query(default=""), limit: int = Query(default=40, le=100)):
    matches = statsbomb_service.search_matches(q, limit=limit)
    return envelope("matches-search", {"q": q, "limit": str(limit)}, matches)


@app.get("/api/matches/{competition_id}/{season_id}")
def list_matches(competition_id: int, season_id: int):
    matches = statsbomb_service.get_matches(competition_id, season_id)
    return envelope(
        "matches",
        {"competition_id": str(competition_id), "season_id": str(season_id)},
        matches,
    )


@app.get("/api/match/{match_id}")
def get_match(match_id: int):
    """Lightweight, no-LLM match view for the dashboard header: match summary
    plus computed team stats (possession, xG) — everything the header shows
    without paying for a Claude call."""
    analytics = statsbomb_service.compute_match_analytics(match_id)
    return envelope(
        "match",
        {"match_id": str(match_id)},
        [{"match": analytics["match"], "team_stats": analytics["team_stats"]}],
    )


@app.get("/api/analytics/{match_id}")
def get_analytics(match_id: int):
    cached = cache_service.get_cached_analytics(match_id)
    if cached is not None:
        return envelope("analytics", {"match_id": str(match_id)}, [{**cached, "cached": True}])

    analytics = statsbomb_service.compute_match_analytics(match_id)
    players = statsbomb_service.compute_player_stats(match_id)

    try:
        ai_evaluation = llm_service.generate_tactical_analysis(
            analytics["match"], analytics["team_stats"], players
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    result = {
        "match": analytics["match"],
        "team_stats": analytics["team_stats"],
        "ai_evaluation": ai_evaluation,
        "model": llm_service.MODEL,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "cached": False,
    }
    cache_service.save_cached_analytics(match_id, result)

    # Re-fetch cached flag as True only for subsequent reads; this response
    # reflects the freshly-generated result.
    return envelope("analytics", {"match_id": str(match_id)}, [result])


@app.get("/api/players/{match_id}")
def list_players(match_id: int):
    cached = cache_service.get_cached_players(match_id)
    if cached is not None:
        return envelope("players", {"match_id": str(match_id)}, cached)
    players = statsbomb_service.compute_player_stats(match_id)
    cache_service.save_cached_players(match_id, players)
    return envelope("players", {"match_id": str(match_id)}, players)


@app.get("/api/passing-network/{match_id}")
def get_passing_network(match_id: int):
    cached = cache_service.get_cached_passing_network(match_id)
    if cached is not None:
        return envelope("passing-network", {"match_id": str(match_id)}, cached)
    networks = statsbomb_service.compute_passing_network(match_id)
    cache_service.save_cached_passing_network(match_id, networks)
    return envelope("passing-network", {"match_id": str(match_id)}, networks)


@app.get("/api/shots/{match_id}")
def get_shots(match_id: int):
    cached = cache_service.get_cached_shots(match_id)
    if cached is not None:
        return envelope("shots", {"match_id": str(match_id)}, cached)
    shots = statsbomb_service.compute_shots(match_id)
    cache_service.save_cached_shots(match_id, shots)
    return envelope("shots", {"match_id": str(match_id)}, shots)


@app.get("/api/timeline/{match_id}")
def get_timeline(match_id: int):
    cached = cache_service.get_cached_timeline(match_id)
    if cached is not None:
        return envelope("timeline", {"match_id": str(match_id)}, cached)
    moments = statsbomb_service.compute_timeline(match_id)
    cache_service.save_cached_timeline(match_id, moments)
    return envelope("timeline", {"match_id": str(match_id)}, moments)

"""Fetches StatsBomb Open Data and turns raw events into the aggregated
stats we hand to the LLM — never raw event JSON (too noisy, too many
tokens; see llm_service.py).

Data access is local-first: this repo ships a full clone of
github.com/statsbomb/open-data under app/data/open-data/data (same folder
layout as the GitHub repo: competitions.json, matches/{competition_id}/
{season_id}.json, events/{match_id}.json). If a file isn't found locally
(e.g. a fresh checkout without the clone), we fall back to fetching it
live from raw.githubusercontent.com, so this keeps working with zero setup
beyond an internet connection.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import httpx
import pandas as pd
from fastapi import HTTPException

LOCAL_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "open-data" / "data"
GITHUB_RAW_BASE = "https://raw.githubusercontent.com/statsbomb/open-data/master/data"

# A standard open-data approximation for "touches" — StatsBomb doesn't
# tag a single "touch" event type, so we count the event types where a
# player is on the ball.
TOUCH_EVENT_TYPES = {"Pass", "Ball Receipt*", "Carry", "Dribble", "Shot"}

# Pitch is 120 (x) x 80 (y) units; thirds split along the length of the pitch.
PITCH_LENGTH = 120
DEFENSIVE_THIRD_MAX_X = PITCH_LENGTH / 3
MIDDLE_THIRD_MAX_X = 2 * PITCH_LENGTH / 3


def _fetch_json(relative_path: str) -> Any:
    """Load a StatsBomb data file by its path relative to data/, e.g.
    "competitions.json" or "events/303470.json". Tries the local clone
    first, then falls back to a live GitHub fetch.
    """
    local_path = LOCAL_DATA_DIR / relative_path
    if local_path.exists():
        with open(local_path, "r", encoding="utf-8") as f:
            return json.load(f)

    url = f"{GITHUB_RAW_BASE}/{relative_path}"
    try:
        response = httpx.get(url, timeout=30.0)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not fetch StatsBomb data file '{relative_path}': {exc}",
        ) from exc
    return response.json()


def get_competitions() -> list[dict]:
    """GET /api/competitions data source. Pulled live/locally each call so
    the match selector always reflects what StatsBomb actually publishes —
    never hardcoded.
    """
    return _fetch_json("competitions.json")


def get_matches(competition_id: int, season_id: int) -> list[dict]:
    raw_matches = _fetch_json(f"matches/{competition_id}/{season_id}.json")
    return [_simplify_match(m) for m in raw_matches]


def _simplify_match(raw_match: dict) -> dict:
    return {
        "match_id": raw_match["match_id"],
        "match_date": raw_match["match_date"],
        "kick_off": raw_match.get("kick_off"),
        "competition_stage": raw_match["competition_stage"]["name"],
        "competition_id": raw_match["competition"]["competition_id"],
        "season_id": raw_match["season"]["season_id"],
        # competitions.json is the source for the human-readable competition /
        # season names — matches files only carry the ids.
        "competition_name": raw_match["competition"].get("competition_name"),
        "season_name": raw_match["season"].get("season_name"),
        "country_name": raw_match["competition"].get("country_name"),
        "home_team": {
            "team_id": raw_match["home_team"]["home_team_id"],
            "team_name": raw_match["home_team"]["home_team_name"],
        },
        "away_team": {
            "team_id": raw_match["away_team"]["away_team_id"],
            "team_name": raw_match["away_team"]["away_team_name"],
        },
        "home_score": raw_match["home_score"],
        "away_score": raw_match["away_score"],
    }


# ---------------------------------------------------------------------------
# Match lookup by match_id alone (the /api/analytics/{match_id} contract
# doesn't carry competition/season). StatsBomb's matches/ files are
# organized by competition+season, so we build a small in-memory index the
# first time it's needed and reuse it afterwards. The matches/ directory is
# a few MB total (unlike events/, which is tens of GB), so this is cheap.
# ---------------------------------------------------------------------------
_match_index: dict[int, dict] | None = None


def _build_match_index() -> dict[int, dict]:
    index: dict[int, dict] = {}
    for competition in get_competitions():
        competition_id = competition["competition_id"]
        season_id = competition["season_id"]
        try:
            raw_matches = _fetch_json(f"matches/{competition_id}/{season_id}.json")
        except HTTPException:
            # Some competition/season combos in competitions.json have no
            # published matches file yet — skip rather than fail the whole index.
            continue
        for raw_match in raw_matches:
            index[raw_match["match_id"]] = _simplify_match(raw_match)
    return index


def get_match_summary(match_id: int) -> dict:
    global _match_index
    if _match_index is None:
        _match_index = _build_match_index()
    match = _match_index.get(match_id)
    if match is None:
        raise HTTPException(status_code=404, detail=f"Match {match_id} not found")
    return match


def search_matches(query: str, limit: int = 40) -> list[dict]:
    """Free-text search across every match in the local StatsBomb clone —
    matches on team names, competition, season, stage, and country. All query
    tokens must appear (AND). An empty query returns the most recent matches so
    the search screen has something to show on first load. Results are newest
    first and capped at `limit`.
    """
    global _match_index
    if _match_index is None:
        _match_index = _build_match_index()

    tokens = [t for t in query.lower().split() if t]

    def haystack(m: dict) -> str:
        return " ".join(
            str(part or "")
            for part in (
                m["home_team"]["team_name"],
                m["away_team"]["team_name"],
                m.get("competition_name"),
                m.get("season_name"),
                m.get("competition_stage"),
                m.get("country_name"),
            )
        ).lower()

    matched = [
        m for m in _match_index.values() if all(t in haystack(m) for t in tokens)
    ]
    matched.sort(key=lambda m: m.get("match_date") or "", reverse=True)
    return matched[:limit]


def get_events(match_id: int) -> list[dict]:
    return _fetch_json(f"events/{match_id}.json")


# StatsBomb period 5 is the penalty shootout — a tiebreaker, not part of the
# match's run of play. Including it distorts every aggregation (shootout
# penalties count as shots/goals with ~0.79 xG each, inflating xG, goals, and
# the man-of-the-match pick), so all stat computations run over regulation +
# extra time only.
def _match_events(match_id: int) -> list[dict]:
    return [e for e in get_events(match_id) if e.get("period") != 5]


def get_lineups(match_id: int) -> list[dict]:
    return _fetch_json(f"lineups/{match_id}.json")


# ---------------------------------------------------------------------------
# Feature engineering — the core of "don't pass raw event JSON to the LLM".
# ---------------------------------------------------------------------------


def _zone_for_x(x: float) -> str:
    if x < DEFENSIVE_THIRD_MAX_X:
        return "defensive_third"
    if x < MIDDLE_THIRD_MAX_X:
        return "middle_third"
    return "attacking_third"


def compute_team_stats(events: list[dict]) -> dict[str, dict]:
    """Aggregate raw StatsBomb events into per-team stats.

    Returns a dict keyed by team_name, each value matching the TeamStats
    schema (possession_pct, total_xg, total_shots, touches,
    zone_passing_pct, pressures, pressure_regain_pct).
    """
    df = pd.json_normalize(events)
    team_names = sorted(df["team.name"].dropna().unique().tolist())
    stats = {team: _empty_team_stats() for team in team_names}

    # Possession % — StatsBomb tags each event with the possession chain id
    # ("possession") and which team held it ("possession_team.name"). Summing
    # each chain's total event duration per team is a much better proxy for
    # time-in-possession than counting touches, since StatsBomb open data has
    # no tracking/clock data to measure possession directly.
    possession_df = df.dropna(subset=["possession", "possession_team.name"])
    if not possession_df.empty:
        chain_seconds = (
            possession_df.groupby(["possession", "possession_team.name"])["duration"]
            .sum()
            .reset_index()
        )
        seconds_by_team = chain_seconds.groupby("possession_team.name")["duration"].sum()
        total_seconds = seconds_by_team.sum()
        if total_seconds > 0:
            for team, seconds in seconds_by_team.items():
                if team in stats:
                    stats[team]["possession_pct"] = round(float(seconds / total_seconds * 100), 1)

    # xG and shot counts.
    shots_df = df[df["type.name"] == "Shot"]
    if not shots_df.empty:
        xg_by_team = shots_df.groupby("team.name")["shot.statsbomb_xg"].sum()
        shots_by_team = shots_df.groupby("team.name").size()
        for team in team_names:
            stats[team]["total_xg"] = round(float(xg_by_team.get(team, 0.0)), 2)
            stats[team]["total_shots"] = int(shots_by_team.get(team, 0))

    # Touches — proxy defined by TOUCH_EVENT_TYPES above.
    touches_df = df[df["type.name"].isin(TOUCH_EVENT_TYPES)]
    if not touches_df.empty:
        touches_by_team = touches_df.groupby("team.name").size()
        for team in team_names:
            stats[team]["touches"] = int(touches_by_team.get(team, 0))

    # Total pass attempts per team.
    all_passes_df = df[df["type.name"] == "Pass"]
    if not all_passes_df.empty:
        passes_by_team = all_passes_df.groupby("team.name").size()
        for team in team_names:
            stats[team]["passes"] = int(passes_by_team.get(team, 0))

    # Duels won — StatsBomb tags a duel's outcome; treat the "won"/"success"
    # variants as wins (the rest are lost or neutral).
    if "duel.outcome.name" in df.columns:
        duels_df = df[df["type.name"] == "Duel"]
        won = duels_df[
            duels_df["duel.outcome.name"].isin(
                ["Won", "Success", "Success In Play", "Success Out"]
            )
        ]
        if not won.empty:
            duels_won_by_team = won.groupby("team.name").size()
            for team in team_names:
                stats[team]["duels_won"] = int(duels_won_by_team.get(team, 0))

    # Zone-based passing — where on the pitch each team's passes originate.
    passes_df = df[df["type.name"] == "Pass"].copy()
    if not passes_df.empty:
        passes_df["origin_x"] = passes_df["location"].apply(
            lambda loc: loc[0] if isinstance(loc, list) else None
        )
        passes_df = passes_df.dropna(subset=["origin_x"])
        passes_df["zone"] = passes_df["origin_x"].apply(_zone_for_x)
        for team in team_names:
            team_passes = passes_df[passes_df["team.name"] == team]
            total = len(team_passes)
            if total == 0:
                continue
            zone_counts = team_passes["zone"].value_counts()
            stats[team]["zone_passing_pct"] = {
                "defensive_third": round(float(zone_counts.get("defensive_third", 0) / total * 100), 1),
                "middle_third": round(float(zone_counts.get("middle_third", 0) / total * 100), 1),
                "attacking_third": round(float(zone_counts.get("attacking_third", 0) / total * 100), 1),
            }

    # Pressing success — a pressure event immediately followed (next event
    # in sequence) by the same team winning the ball back counts as a
    # successful regain. Simplified proxy given no tracking data.
    df_sorted = df.sort_values("index").reset_index(drop=True)
    is_pressure = df_sorted["type.name"] == "Pressure"
    next_type = df_sorted["type.name"].shift(-1)
    next_team = df_sorted["team.name"].shift(-1)
    regained = is_pressure & (next_team == df_sorted["team.name"]) & next_type.isin(
        ["Ball Recovery", "Interception", "Duel"]
    )
    pressures_by_team = df_sorted[is_pressure].groupby("team.name").size()
    regains_by_team = df_sorted[regained].groupby("team.name").size()
    for team in team_names:
        pressures = int(pressures_by_team.get(team, 0))
        regains = int(regains_by_team.get(team, 0))
        stats[team]["pressures"] = pressures
        stats[team]["pressure_regain_pct"] = round(float(regains / pressures * 100), 1) if pressures else 0.0

    return stats


def _empty_team_stats() -> dict:
    return {
        "possession_pct": 0.0,
        "total_xg": 0.0,
        "total_shots": 0,
        "touches": 0,
        "passes": 0,
        "duels_won": 0,
        "zone_passing_pct": {"defensive_third": 0.0, "middle_third": 0.0, "attacking_third": 0.0},
        "pressures": 0,
        "pressure_regain_pct": 0.0,
    }


def compute_match_analytics(match_id: int) -> dict:
    """Everything /api/analytics/{match_id} needs: match context plus the
    aggregated, feature-engineered team stats fed to the LLM.
    """
    match = get_match_summary(match_id)
    events = _match_events(match_id)
    team_stats = compute_team_stats(events)
    return {"match": match, "team_stats": team_stats}


def _clock_to_minutes(clock: str | None, default: float = 0.0) -> float:
    """StatsBomb lineup position clocks are continuous match time (e.g.
    "78:15" in the second half, not reset from "00:00" at half time), so a
    plain difference between two clocks is the minutes played in that spell.

    A position's "to" is null when the player was still on the pitch at
    full time — callers pass the match's last event minute as `default`.
    """
    if clock is None:
        return default
    minutes, seconds = clock.split(":")
    return int(minutes) + int(seconds) / 60


def compute_player_stats(match_id: int) -> list[dict]:
    """Per-player stat lines for every rostered player in a match — starters
    and unused subs alike — built from lineups (roster, shirt numbers,
    positions, time on pitch) plus the same event stream compute_team_stats
    uses, aggregated per player instead of per team.
    """
    match = get_match_summary(match_id)
    home_team_name = match["home_team"]["team_name"]

    events = _match_events(match_id)
    df = pd.json_normalize(events)

    # Fallback for position spells with "to": null (player was still on the
    # pitch at full time / end of extra time) — the last event's clock.
    match_end_minutes = float(df["minute"].max()) if "minute" in df.columns and not df.empty else 90.0

    shot_xg_by_id: dict[str, float] = {}
    if "shot.statsbomb_xg" in df.columns:
        shots = df[df["type.name"] == "Shot"].dropna(subset=["shot.statsbomb_xg"])
        shot_xg_by_id = dict(zip(shots["id"], shots["shot.statsbomb_xg"]))

    goals_by_player = _count_events(df, df["type.name"] == "Shot", "shot.outcome.name", "Goal")
    assists_by_player = _count_events(df, df["type.name"] == "Pass", "pass.goal_assist", True)
    passes_by_player = _count_by(df, df["type.name"] == "Pass")
    dribbles_by_player = _count_events(df, df["type.name"] == "Dribble", "dribble.outcome.name", "Complete")
    touches_by_player = _count_by(df, df["type.name"].isin(TOUCH_EVENT_TYPES))
    tackles_by_player = _count_events(df, df["type.name"] == "Duel", "duel.type.name", "Tackle")

    incomplete_passes_by_player: dict[int, int] = {}
    if "pass.outcome.name" in df.columns:
        incomplete = df[(df["type.name"] == "Pass") & df["pass.outcome.name"].notna()]
        incomplete_passes_by_player = incomplete.groupby("player.id").size().to_dict()

    xg_by_player: dict[int, float] = {}
    if "shot.statsbomb_xg" in df.columns:
        shots_with_xg = df[df["type.name"] == "Shot"].dropna(subset=["shot.statsbomb_xg"])
        xg_by_player = shots_with_xg.groupby("player.id")["shot.statsbomb_xg"].sum().to_dict()

    xa_by_player: dict[int, float] = {}
    if "pass.shot_assist" in df.columns:
        key_passes = df[(df["type.name"] == "Pass") & (df["pass.shot_assist"] == True)]  # noqa: E712
        for _, row in key_passes.iterrows():
            shot_xg = shot_xg_by_id.get(row.get("pass.assisted_shot_id"), 0.0)
            xa_by_player[row["player.id"]] = xa_by_player.get(row["player.id"], 0.0) + shot_xg

    avg_position_by_player: dict[int, dict] = {}
    touch_locations_by_player: dict[int, list[dict]] = {}
    touches_df = df[df["type.name"].isin(TOUCH_EVENT_TYPES)].copy()
    if not touches_df.empty:
        touches_df["loc_x"] = touches_df["location"].apply(lambda loc: loc[0] if isinstance(loc, list) else None)
        touches_df["loc_y"] = touches_df["location"].apply(lambda loc: loc[1] if isinstance(loc, list) else None)
        touches_df = touches_df.dropna(subset=["loc_x", "loc_y"])

        avg_pos = touches_df.groupby("player.id")[["loc_x", "loc_y"]].mean()
        avg_position_by_player = {
            int(player_id): {"x": round(float(row.loc_x), 1), "y": round(float(row.loc_y), 1)}
            for player_id, row in avg_pos.iterrows()
        }

        # Every individual touch location, straight from the real event
        # stream — the raw data a per-player heatmap is built from, not an
        # inferred or synthesized distribution.
        for player_id, group in touches_df.groupby("player.id"):
            touch_locations_by_player[int(player_id)] = [
                {"x": round(float(x), 1), "y": round(float(y), 1)}
                for x, y in zip(group["loc_x"], group["loc_y"])
            ]

    players: list[dict] = []
    for team in get_lineups(match_id):
        team_name = team["team_name"]
        home_or_away = "home" if team_name == home_team_name else "away"
        for player in team["lineup"]:
            player_id = player["player_id"]
            positions = player.get("positions", [])
            minutes_played = sum(
                _clock_to_minutes(p["to"], default=match_end_minutes) - _clock_to_minutes(p["from"])
                for p in positions
            )
            passes = int(passes_by_player.get(player_id, 0))
            incomplete = int(incomplete_passes_by_player.get(player_id, 0))
            # A player is in the starting XI if any of their position spells was
            # entered as "Starting XI" (subs get "Substitution - On (...)").
            is_starter = any(p.get("start_reason") == "Starting XI" for p in positions)
            players.append(
                {
                    "player_id": player_id,
                    "name": player.get("player_nickname") or player["player_name"],
                    "team_name": team_name,
                    "home_or_away": home_or_away,
                    "position": positions[0]["position"] if positions else None,
                    "shirt_number": player["jersey_number"],
                    "is_starter": is_starter,
                    "minutes_played": round(minutes_played, 1),
                    "stats": {
                        "goals": int(goals_by_player.get(player_id, 0)),
                        "assists": int(assists_by_player.get(player_id, 0)),
                        "passes": passes,
                        "pass_accuracy": round((passes - incomplete) / passes * 100, 1) if passes else 0.0,
                        "xg": round(float(xg_by_player.get(player_id, 0.0)), 2),
                        "xa": round(float(xa_by_player.get(player_id, 0.0)), 2),
                        "touches": int(touches_by_player.get(player_id, 0)),
                        "tackles": int(tackles_by_player.get(player_id, 0)),
                        "dribbles": int(dribbles_by_player.get(player_id, 0)),
                    },
                    "average_position": avg_position_by_player.get(player_id),
                    "touch_locations": touch_locations_by_player.get(player_id, []),
                }
            )
    return players


def compute_passing_network(match_id: int) -> list[dict]:
    """Per-team passing network: one node per player who attempted a pass,
    positioned at their average pass-origin location, plus one edge per
    unique passer -> recipient pair weighted by completed-pass count.

    Real data only — StatsBomb leaves pass.outcome.name null for completed
    passes and tags the receiving player.id on pass.recipient.id, so no
    inference is needed to build edges.
    """
    match = get_match_summary(match_id)
    home_team_name = match["home_team"]["team_name"]

    events = _match_events(match_id)
    df = pd.json_normalize(events)

    passes_df = df[df["type.name"] == "Pass"].copy()
    if passes_df.empty:
        return []

    passes_df["origin_x"] = passes_df["location"].apply(lambda loc: loc[0] if isinstance(loc, list) else None)
    passes_df["origin_y"] = passes_df["location"].apply(lambda loc: loc[1] if isinstance(loc, list) else None)
    passes_df = passes_df.dropna(subset=["origin_x", "origin_y", "player.id"])

    completed_df = pd.DataFrame(columns=passes_df.columns)
    if "pass.outcome.name" in passes_df.columns and "pass.recipient.id" in passes_df.columns:
        completed_df = passes_df[passes_df["pass.outcome.name"].isna()].dropna(subset=["pass.recipient.id"])

    player_names = (
        df.dropna(subset=["player.id", "player.name"])
        .drop_duplicates("player.id")
        .set_index("player.id")["player.name"]
        .to_dict()
    )

    networks: list[dict] = []
    for team_name, team_passes in passes_df.groupby("team.name"):
        avg_pos = team_passes.groupby("player.id")[["origin_x", "origin_y"]].mean()
        pass_counts = team_passes.groupby("player.id").size()

        team_completed = completed_df[completed_df["team.name"] == team_name]
        edge_counts = (
            team_completed.groupby(["player.id", "pass.recipient.id"]).size()
            if not team_completed.empty
            else pd.Series(dtype=int)
        )

        nodes = [
            {
                "player_id": int(player_id),
                "name": player_names.get(player_id, "Unknown"),
                "x": round(float(row.origin_x), 1),
                "y": round(float(row.origin_y), 1),
                "pass_count": int(pass_counts.get(player_id, 0)),
            }
            for player_id, row in avg_pos.iterrows()
        ]

        edges = [
            {"from_player_id": int(from_id), "to_player_id": int(to_id), "count": int(count)}
            for (from_id, to_id), count in edge_counts.items()
        ]

        networks.append(
            {
                "team_name": team_name,
                "home_or_away": "home" if team_name == home_team_name else "away",
                "nodes": nodes,
                "edges": edges,
            }
        )

    return networks


# StatsBomb records a shot's end point in 3D — [x, y, z] where z is the ball's
# height at that point in the same pitch units (goal crossbar sits at z ~= 2.67).
# Shots that never reach the goal line (blocked, wayward) can carry a 2D
# end_location instead; we default those to ground level so every shot still
# renders as a real trajectory in the 3D scene.
def compute_shots(match_id: int) -> list[dict]:
    """Every shot in the match with its real 3D trajectory: start location on
    the pitch, [x, y, z] end location, outcome, xG, taker, and minute.

    This is the data source for the 3D shot-trajectory scene — no positions
    are inferred, the arc is drawn between two real StatsBomb coordinates.
    """
    match = get_match_summary(match_id)
    home_team_name = match["home_team"]["team_name"]

    events = _match_events(match_id)

    shots: list[dict] = []
    for event in events:
        if event.get("type", {}).get("name") != "Shot":
            continue
        shot = event.get("shot", {})
        start = event.get("location")
        end = shot.get("end_location")
        if not isinstance(start, list) or not isinstance(end, list):
            continue

        # Normalize the end point to 3D — pad a ground-level z for the shots
        # StatsBomb only tagged in 2D.
        end_x = float(end[0])
        end_y = float(end[1])
        end_z = float(end[2]) if len(end) > 2 else 0.0

        team_name = event.get("team", {}).get("name")
        player = event.get("player", {})
        shots.append(
            {
                "id": event.get("id"),
                "team_name": team_name,
                "home_or_away": "home" if team_name == home_team_name else "away",
                "player_name": player.get("name"),
                "minute": event.get("minute", 0),
                "outcome": shot.get("outcome", {}).get("name"),
                "is_goal": shot.get("outcome", {}).get("name") == "Goal",
                "xg": round(float(shot.get("statsbomb_xg", 0.0)), 3),
                "body_part": shot.get("body_part", {}).get("name"),
                "start": {"x": round(float(start[0]), 1), "y": round(float(start[1]), 1)},
                "end": {"x": round(end_x, 1), "y": round(end_y, 1), "z": round(end_z, 2)},
            }
        )

    return shots


# xG at or above this counts as a "big chance" in the key-moments list — a
# clear scoring opportunity, whether or not it was taken.
BIG_CHANCE_XG = 0.3


def compute_timeline(match_id: int) -> list[dict]:
    """Auto-extracted key moments for the match timeline — goals, big chances,
    cards, and substitutions — straight from the event stream, no LLM. Each
    moment is timestamped (minute/second) and tagged with the team side so the
    frontend can lay them out chronologically and filter (e.g. subs only).
    """
    match = get_match_summary(match_id)
    home_team_name = match["home_team"]["team_name"]

    def side(team_name: str | None) -> str:
        return "home" if team_name == home_team_name else "away"

    moments: list[dict] = []
    for event in _match_events(match_id):
        etype = event.get("type", {}).get("name")
        team_name = event.get("team", {}).get("name")
        minute = int(event.get("minute", 0))
        second = int(event.get("second", 0))
        player = (event.get("player") or {}).get("name")

        if etype == "Shot":
            shot = event.get("shot", {})
            outcome = shot.get("outcome", {}).get("name")
            xg = round(float(shot.get("statsbomb_xg", 0.0)), 3)
            if outcome == "Goal":
                moments.append(_moment(minute, second, side(team_name), team_name,
                                       "goal", player, description=f"Goal — {player}", xg=xg))
            elif xg >= BIG_CHANCE_XG:
                moments.append(_moment(minute, second, side(team_name), team_name,
                                       "big_chance", player,
                                       description=f"Big chance ({xg:.2f} xG) — {player}", xg=xg))
        elif etype == "Own Goal For":
            moments.append(_moment(minute, second, side(team_name), team_name,
                                   "goal", player, description=f"Own goal — {player}"))
        elif etype == "Substitution":
            player_on = (event.get("substitution", {}).get("replacement") or {}).get("name")
            moments.append(_moment(minute, second, side(team_name), team_name,
                                   "substitution", player, player_off=player, player_on=player_on,
                                   description=f"{player_on} on for {player}"))
        elif etype in ("Bad Behaviour", "Foul Committed"):
            key = "bad_behaviour" if etype == "Bad Behaviour" else "foul_committed"
            card = (event.get(key, {}) or {}).get("card", {})
            card_name = card.get("name") if isinstance(card, dict) else None
            if card_name:
                kind = "red_card" if "Red" in card_name else "yellow_card"
                moments.append(_moment(minute, second, side(team_name), team_name,
                                       kind, player, description=f"{card_name} — {player}"))

    moments.sort(key=lambda m: (m["minute"], m["second"]))
    return moments


def _moment(minute, second, home_or_away, team_name, mtype, player, *,
            player_off=None, player_on=None, xg=None, description=""):
    return {
        "minute": minute,
        "second": second,
        "home_or_away": home_or_away,
        "team_name": team_name,
        "type": mtype,
        "player": player,
        "player_off": player_off,
        "player_on": player_on,
        "xg": xg,
        "description": description,
    }


def _count_by(df: pd.DataFrame, mask: pd.Series) -> dict:
    if not mask.any():
        return {}
    return df[mask].groupby("player.id").size().to_dict()


def _count_events(df: pd.DataFrame, mask: pd.Series, column: str, value) -> dict:
    if column not in df.columns:
        return {}
    matched = df[mask & (df[column] == value)]
    if matched.empty:
        return {}
    return matched.groupby("player.id").size().to_dict()

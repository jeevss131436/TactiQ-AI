"""Pydantic response models. Field names mirror the StatsBomb Open Data
vocabulary (competition_id, season_id, team_name, ...) so the API surface
stays legible against the source data.
"""

from typing import Optional

from pydantic import BaseModel


class Competition(BaseModel):
    competition_id: int
    season_id: int
    competition_name: str
    season_name: str
    country_name: str
    competition_gender: Optional[str] = None


class Team(BaseModel):
    team_id: int
    team_name: str


class MatchSummary(BaseModel):
    match_id: int
    match_date: str
    kick_off: Optional[str] = None
    competition_stage: str
    competition_id: int
    season_id: int
    home_team: Team
    away_team: Team
    home_score: int
    away_score: int


class ZonePassingPct(BaseModel):
    defensive_third: float
    middle_third: float
    attacking_third: float


class TeamStats(BaseModel):
    """Aggregated, feature-engineered stats for one team in one match.

    These are the numbers handed to the LLM — never raw event JSON.
    """

    possession_pct: float
    total_xg: float
    total_shots: int
    touches: int
    zone_passing_pct: ZonePassingPct
    pressures: int
    pressure_regain_pct: float


class AIEvaluation(BaseModel):
    """Structured output forced from Claude via tool use. Field set matches
    the hackathon's defined schema, plus the two "small addition" fields
    (mvp reasoning, storyline headline) called out in the feature spec as
    reusing this same structured-output call.
    """

    summary: str
    strengths: list[str]
    weaknesses: list[str]
    turning_points: list[str]
    mvp: str
    man_of_the_match_reasoning: str
    match_storyline_headline: str
    key_stat_callouts: list[str]


class AveragePosition(BaseModel):
    x: float
    y: float


class PlayerMatchStats(BaseModel):
    goals: int
    assists: int
    passes: int
    pass_accuracy: float
    xg: float
    xa: float
    touches: int
    tackles: int
    dribbles: int


class Player(BaseModel):
    """One rostered player's stat line for a single match — starters and
    unused substitutes alike. Built from lineups.json + events.json, never
    aggregated across matches (that needs cross-match work; out of MVP
    scope per the feature spec).
    """

    player_id: int
    name: str
    team_name: str
    home_or_away: str
    position: Optional[str] = None
    shirt_number: int
    minutes_played: float
    stats: PlayerMatchStats
    average_position: Optional[AveragePosition] = None
    touch_locations: list[AveragePosition] = []


class AnalyticsResponse(BaseModel):
    match: MatchSummary
    team_stats: dict[str, TeamStats]  # keyed by team_name
    ai_evaluation: AIEvaluation
    generated_at: str
    cached: bool

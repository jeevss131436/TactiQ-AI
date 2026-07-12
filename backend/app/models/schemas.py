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
    passes: int
    duels_won: int
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
    is_starter: bool
    minutes_played: float
    stats: PlayerMatchStats
    average_position: Optional[AveragePosition] = None
    touch_locations: list[AveragePosition] = []


class KeyMoment(BaseModel):
    """One auto-extracted timeline event (goal, big chance, card, substitution)."""

    minute: int
    second: int
    home_or_away: str
    team_name: str
    type: str  # goal | big_chance | yellow_card | red_card | substitution
    player: Optional[str] = None
    player_off: Optional[str] = None
    player_on: Optional[str] = None
    xg: Optional[float] = None
    description: str


class PassingNetworkNode(BaseModel):
    player_id: int
    name: str
    x: float
    y: float
    pass_count: int


class PassingNetworkEdge(BaseModel):
    from_player_id: int
    to_player_id: int
    count: int


class TeamPassingNetwork(BaseModel):
    team_name: str
    home_or_away: str
    nodes: list[PassingNetworkNode]
    edges: list[PassingNetworkEdge]


class ShotStart(BaseModel):
    x: float
    y: float


class ShotEnd(BaseModel):
    x: float
    y: float
    z: float  # ball height at the end point, in pitch units (crossbar ~= 2.67)


class Shot(BaseModel):
    """One shot with its real 3D trajectory — the data behind the 3D scene."""

    id: Optional[str] = None
    team_name: str
    home_or_away: str
    player_name: Optional[str] = None
    minute: int
    outcome: Optional[str] = None
    is_goal: bool
    xg: float
    body_part: Optional[str] = None
    start: ShotStart
    end: ShotEnd


class AnalyticsResponse(BaseModel):
    match: MatchSummary
    team_stats: dict[str, TeamStats]  # keyed by team_name
    ai_evaluation: AIEvaluation
    generated_at: str
    cached: bool

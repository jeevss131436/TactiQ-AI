// Talks to the real FastAPI backend (backend/app/main.py) — the source for
// real per-player touch data (heatmaps), sourced only from the actual
// StatsBomb Open Data clone in backend/app/data, never mocked or inferred.

import { useEffect, useState } from "react";
import type { MatchStats, MatchSummary } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// A single match's summary as served by the backend (snake_case), covering
// both the search results and the /api/match/{id} view.
interface RawMatchSummary {
  match_id: number;
  match_date: string;
  competition_stage: string;
  competition_name: string | null;
  season_name: string | null;
  country_name: string | null;
  home_team: { team_id: number; team_name: string };
  away_team: { team_id: number; team_name: string };
  home_score: number;
  away_score: number;
}

function mapMatchSummary(m: RawMatchSummary): MatchSummary {
  return {
    matchId: m.match_id,
    matchDate: m.match_date,
    competitionStage: m.competition_stage,
    competitionName: m.competition_name ?? undefined,
    seasonName: m.season_name ?? undefined,
    countryName: m.country_name ?? undefined,
    homeTeam: { teamId: m.home_team.team_id, teamName: m.home_team.team_name },
    awayTeam: { teamId: m.away_team.team_id, teamName: m.away_team.team_name },
    homeScore: m.home_score,
    awayScore: m.away_score,
  };
}

// Free-text match search across the whole local StatsBomb clone (~4,000 games).
// An empty query returns the most recent matches.
export async function searchMatches(query: string, limit = 40): Promise<MatchSummary[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await fetch(`${API_BASE_URL}/api/matches/search?${params}`);
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status} for /api/matches/search`);
  }
  const data: { response: RawMatchSummary[] } = await res.json();
  return data.response.map(mapMatchSummary);
}

interface RawTeamStats {
  possession_pct: number;
  total_xg: number;
  total_shots: number;
  touches: number;
  passes: number;
  duels_won: number;
}

interface RawMatchView {
  match: RawMatchSummary;
  team_stats: Record<string, RawTeamStats>;
}

// Per-team aggregate stats for the side-by-side comparison view.
export interface RealTeamStats {
  possessionPct: number;
  totalXg: number;
  totalShots: number;
  touches: number;
  passes: number;
  duelsWon: number;
}

const EMPTY_TEAM_STATS: RawTeamStats = {
  possession_pct: 0,
  total_xg: 0,
  total_shots: 0,
  touches: 0,
  passes: 0,
  duels_won: 0,
};

function mapTeamStats(t: RawTeamStats): RealTeamStats {
  return {
    possessionPct: t.possession_pct,
    totalXg: t.total_xg,
    totalShots: t.total_shots,
    touches: t.touches,
    passes: t.passes,
    duelsWon: t.duels_won,
  };
}

export interface MatchView {
  match: MatchSummary;
  stats: MatchStats;
  teamStats: { home: RealTeamStats; away: RealTeamStats };
}

// The dashboard header + overview view for one match: real match summary and
// real team stats (possession, xG, passes, duels), with no LLM call.
export async function fetchMatch(matchId: number): Promise<MatchView> {
  const res = await fetch(`${API_BASE_URL}/api/match/${matchId}`);
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status} for /api/match/${matchId}`);
  }
  const data: { response: RawMatchView[] } = await res.json();
  const raw = data.response[0];
  if (!raw) throw new Error(`Match ${matchId} not found`);
  const match = mapMatchSummary(raw.match);
  const home = raw.team_stats[match.homeTeam.teamName] ?? EMPTY_TEAM_STATS;
  const away = raw.team_stats[match.awayTeam.teamName] ?? EMPTY_TEAM_STATS;
  return {
    match,
    stats: {
      homeXg: home.total_xg,
      awayXg: away.total_xg,
      homePossession: Math.round(home.possession_pct),
      awayPossession: Math.round(away.possession_pct),
    },
    teamStats: { home: mapTeamStats(home), away: mapTeamStats(away) },
  };
}

export function useMatch(matchId: number | null) {
  const [data, setData] = useState<MatchView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setData(null);
    setError(null);

    fetchMatch(matchId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load match");
      });

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  return { data, error };
}

export interface RealPlayerStats {
  goals: number;
  assists: number;
  passes: number;
  passAccuracy: number;
  xg: number;
  xa: number;
  touches: number;
  tackles: number;
  dribbles: number;
}

// One rostered player's full real stat line for a match — the source for both
// the movement heatmaps (touchLocations) and the Player Analytics tab (stats).
export interface RealPlayerTouches {
  playerId: number;
  name: string;
  teamName: string;
  homeOrAway: "home" | "away";
  position: string | null;
  shirtNumber: number;
  isStarter: boolean;
  minutesPlayed: number;
  stats: RealPlayerStats;
  // Average position (mean of touch x/y) in StatsBomb 120x80 units — the anchor
  // for the formation plot. Null if the player recorded no on-ball touches.
  averagePosition: { x: number; y: number } | null;
  // Raw touch coordinates in StatsBomb's native 120x80 pitch units.
  touchLocations: { x: number; y: number }[];
}

interface ApiEnvelope<T> {
  response: T[];
}

interface RawPlayer {
  player_id: number;
  name: string;
  team_name: string;
  home_or_away: "home" | "away";
  position: string | null;
  shirt_number: number;
  is_starter: boolean;
  minutes_played: number;
  stats: {
    goals: number;
    assists: number;
    passes: number;
    pass_accuracy: number;
    xg: number;
    xa: number;
    touches: number;
    tackles: number;
    dribbles: number;
  };
  average_position: { x: number; y: number } | null;
  touch_locations: { x: number; y: number }[];
}

export async function fetchMatchPlayerTouches(matchId: number): Promise<RealPlayerTouches[]> {
  const res = await fetch(`${API_BASE_URL}/api/players/${matchId}`);
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status} for /api/players/${matchId}`);
  }
  const data: ApiEnvelope<RawPlayer> = await res.json();
  return data.response.map((p) => ({
    playerId: p.player_id,
    name: p.name,
    teamName: p.team_name,
    homeOrAway: p.home_or_away,
    position: p.position,
    shirtNumber: p.shirt_number,
    isStarter: p.is_starter,
    minutesPlayed: p.minutes_played,
    stats: {
      goals: p.stats.goals,
      assists: p.stats.assists,
      passes: p.stats.passes,
      passAccuracy: p.stats.pass_accuracy,
      xg: p.stats.xg,
      xa: p.stats.xa,
      touches: p.stats.touches,
      tackles: p.stats.tackles,
      dribbles: p.stats.dribbles,
    },
    averagePosition: p.average_position,
    touchLocations: p.touch_locations,
  }));
}

export interface RealPassingNetworkNode {
  playerId: number;
  name: string;
  // Average pass-origin location, in StatsBomb's native 120x80 pitch units.
  x: number;
  y: number;
  passCount: number;
}

export interface RealPassingNetworkEdge {
  fromPlayerId: number;
  toPlayerId: number;
  count: number;
}

export interface RealTeamPassingNetwork {
  teamName: string;
  homeOrAway: "home" | "away";
  nodes: RealPassingNetworkNode[];
  edges: RealPassingNetworkEdge[];
}

interface RawPassingNetworkTeam {
  team_name: string;
  home_or_away: "home" | "away";
  nodes: { player_id: number; name: string; x: number; y: number; pass_count: number }[];
  edges: { from_player_id: number; to_player_id: number; count: number }[];
}

export async function fetchMatchPassingNetwork(matchId: number): Promise<RealTeamPassingNetwork[]> {
  const res = await fetch(`${API_BASE_URL}/api/passing-network/${matchId}`);
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status} for /api/passing-network/${matchId}`);
  }
  const data: ApiEnvelope<RawPassingNetworkTeam> = await res.json();
  return data.response.map((team) => ({
    teamName: team.team_name,
    homeOrAway: team.home_or_away,
    nodes: team.nodes.map((n) => ({
      playerId: n.player_id,
      name: n.name,
      x: n.x,
      y: n.y,
      passCount: n.pass_count,
    })),
    edges: team.edges.map((e) => ({
      fromPlayerId: e.from_player_id,
      toPlayerId: e.to_player_id,
      count: e.count,
    })),
  }));
}

export function useMatchPassingNetwork(matchId: number) {
  const [networks, setNetworks] = useState<RealTeamPassingNetwork[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setNetworks(null);
    setError(null);

    fetchMatchPassingNetwork(matchId)
      .then((data) => {
        if (!cancelled) setNetworks(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load passing network");
      });

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  return { networks, error };
}

export interface RealShot {
  id: string | null;
  teamName: string;
  homeOrAway: "home" | "away";
  playerName: string | null;
  minute: number;
  outcome: string | null;
  isGoal: boolean;
  xg: number;
  bodyPart: string | null;
  // Real StatsBomb coordinates in native 120x80 pitch units. `end.z` is the
  // ball's height at the end point (crossbar ~= 2.67), the third dimension
  // the 3D scene draws each trajectory into.
  start: { x: number; y: number };
  end: { x: number; y: number; z: number };
}

interface RawShot {
  id: string | null;
  team_name: string;
  home_or_away: "home" | "away";
  player_name: string | null;
  minute: number;
  outcome: string | null;
  is_goal: boolean;
  xg: number;
  body_part: string | null;
  start: { x: number; y: number };
  end: { x: number; y: number; z: number };
}

export async function fetchMatchShots(matchId: number): Promise<RealShot[]> {
  const res = await fetch(`${API_BASE_URL}/api/shots/${matchId}`);
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status} for /api/shots/${matchId}`);
  }
  const data: ApiEnvelope<RawShot> = await res.json();
  return data.response.map((s) => ({
    id: s.id,
    teamName: s.team_name,
    homeOrAway: s.home_or_away,
    playerName: s.player_name,
    minute: s.minute,
    outcome: s.outcome,
    isGoal: s.is_goal,
    xg: s.xg,
    bodyPart: s.body_part,
    start: s.start,
    end: s.end,
  }));
}

export function useMatchShots(matchId: number) {
  const [shots, setShots] = useState<RealShot[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setShots(null);
    setError(null);

    fetchMatchShots(matchId)
      .then((data) => {
        if (!cancelled) setShots(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load shot data");
      });

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  return { shots, error };
}

export type KeyMomentType =
  | "goal"
  | "big_chance"
  | "yellow_card"
  | "red_card"
  | "substitution";

// One auto-extracted key moment (goal, big chance, card, substitution) — no
// LLM, straight from the event stream. Timestamped and tagged by team side.
export interface RealKeyMoment {
  minute: number;
  second: number;
  homeOrAway: "home" | "away";
  teamName: string;
  type: KeyMomentType;
  player: string | null;
  playerOff: string | null;
  playerOn: string | null;
  xg: number | null;
  description: string;
}

interface RawKeyMoment {
  minute: number;
  second: number;
  home_or_away: "home" | "away";
  team_name: string;
  type: KeyMomentType;
  player: string | null;
  player_off: string | null;
  player_on: string | null;
  xg: number | null;
  description: string;
}

export async function fetchMatchTimeline(matchId: number): Promise<RealKeyMoment[]> {
  const res = await fetch(`${API_BASE_URL}/api/timeline/${matchId}`);
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status} for /api/timeline/${matchId}`);
  }
  const data: ApiEnvelope<RawKeyMoment> = await res.json();
  return data.response.map((m) => ({
    minute: m.minute,
    second: m.second,
    homeOrAway: m.home_or_away,
    teamName: m.team_name,
    type: m.type,
    player: m.player,
    playerOff: m.player_off,
    playerOn: m.player_on,
    xg: m.xg,
    description: m.description,
  }));
}

export function useMatchTimeline(matchId: number) {
  const [moments, setMoments] = useState<RealKeyMoment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMoments(null);
    setError(null);

    fetchMatchTimeline(matchId)
      .then((data) => {
        if (!cancelled) setMoments(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load timeline");
      });

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  return { moments, error };
}

// Structured AI tactical analysis — the single Claude tool call from
// backend/app/services/llm_service.py, reasoned over the same computed stats
// (team + per-player) the rest of the dashboard renders. The man-of-the-match
// pick and storyline headline both come out of this one call.
export interface RealAIEvaluation {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  turningPoints: string[];
  mvp: string;
  manOfTheMatchReasoning: string;
  matchStorylineHeadline: string;
  keyStatCallouts: string[];
  generatedAt: string;
}

interface RawAIEvaluation {
  match: unknown;
  ai_evaluation: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    turning_points: string[];
    mvp: string;
    man_of_the_match_reasoning: string;
    match_storyline_headline: string;
    key_stat_callouts: string[];
  };
  generated_at: string;
}

export async function fetchMatchAnalytics(matchId: number): Promise<RealAIEvaluation> {
  const res = await fetch(`${API_BASE_URL}/api/analytics/${matchId}`);
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status} for /api/analytics/${matchId}`);
  }
  const data: ApiEnvelope<RawAIEvaluation> = await res.json();
  const raw = data.response[0];
  if (!raw?.ai_evaluation) {
    throw new Error("Backend returned no AI evaluation");
  }
  const ai = raw.ai_evaluation;
  return {
    summary: ai.summary,
    strengths: ai.strengths,
    weaknesses: ai.weaknesses,
    turningPoints: ai.turning_points,
    mvp: ai.mvp,
    manOfTheMatchReasoning: ai.man_of_the_match_reasoning,
    matchStorylineHeadline: ai.match_storyline_headline,
    keyStatCallouts: ai.key_stat_callouts,
    generatedAt: raw.generated_at,
  };
}

export function useMatchAnalytics(matchId: number) {
  const [evaluation, setEvaluation] = useState<RealAIEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEvaluation(null);
    setError(null);

    fetchMatchAnalytics(matchId)
      .then((data) => {
        if (!cancelled) setEvaluation(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load AI analysis");
      });

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  return { evaluation, error };
}

// Fetches once per matchId and shares the result with every component that
// calls it for the same match — used at the dashboard level so the
// Tactical Analysis and Visualizations tabs don't each fetch independently.
export function useMatchPlayers(matchId: number) {
  const [players, setPlayers] = useState<RealPlayerTouches[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPlayers(null);
    setError(null);

    fetchMatchPlayerTouches(matchId)
      .then((data) => {
        if (!cancelled) setPlayers(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load player data");
      });

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  return { players, error };
}

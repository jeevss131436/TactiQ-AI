// Talks to the real FastAPI backend (backend/app/main.py) — the source for
// real per-player touch data (heatmaps), sourced only from the actual
// StatsBomb Open Data clone in backend/app/data, never mocked or inferred.

import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export interface RealPlayerTouches {
  playerId: number;
  name: string;
  teamName: string;
  homeOrAway: "home" | "away";
  minutesPlayed: number;
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
  minutes_played: number;
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
    minutesPlayed: p.minutes_played,
    touchLocations: p.touch_locations,
  }));
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

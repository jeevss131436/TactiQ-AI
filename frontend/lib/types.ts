// Types mirror the shape of StatsBomb Open Data + the TactiqAI reasoning layer
// that sits on top of it (backend/app/*.py serves these to the frontend).
// The live AI evaluation and per-player types live in lib/api.ts alongside the
// fetchers that produce them.

export interface Team {
  teamId: number;
  teamName: string;
  crestUrl?: string;
}

export interface MatchSummary {
  matchId: number;
  matchDate: string;
  competitionStage: string;
  competitionName?: string;
  seasonName?: string;
  countryName?: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
}

export interface MatchStats {
  homeXg: number;
  awayXg: number;
  homePossession: number; // percentage, 0-100
  awayPossession: number;
}

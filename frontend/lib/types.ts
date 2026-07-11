// Types mirror the shape of StatsBomb Open Data + the TactiqAI reasoning layer
// that sits on top of it (backend/app/*.py serves these to the frontend).

export interface Competition {
  competitionId: number;
  seasonId: number;
  competitionName: string;
  countryName: string;
  seasonName: string;
}

export interface Team {
  teamId: number;
  teamName: string;
  crestUrl?: string;
}

export interface MatchSummary {
  matchId: number;
  matchDate: string;
  competitionStage: string;
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

export interface KeyMoment {
  minute: number;
  team: "home" | "away";
  type: "goal" | "card" | "substitution" | "tactical-shift" | "chance";
  description: string;
}

// Maps to the structured JSON schema returned by the LLM tactical reasoning step
export interface AIEvaluation {
  matchId: number;
  storyline: string; // one-liner summary
  summary: string;
  strengths: TeamSplit<string[]>;
  weaknesses: TeamSplit<string[]>;
  keyMoments: KeyMoment[];
  generatedAt: string;
}

export interface TeamSplit<T> {
  home: T;
  away: T;
}

export interface PlayerPosition {
  x: number; // 0-100, pitch-relative
  y: number; // 0-100, pitch-relative
}

export interface Player {
  playerId: number;
  name: string;
  team: "home" | "away";
  position: string;
  shirtNumber: number;
  minutesPlayed: number;
  stats: {
    goals: number;
    assists: number;
    passes: number;
    passAccuracy: number; // percentage
    xg: number;
    xa: number;
    touches: number;
    tackles: number;
    dribbles: number;
  };
  averagePosition: PlayerPosition;
}

export interface PassingNetworkEdge {
  fromPlayerId: number;
  toPlayerId: number;
  count: number;
}

export interface PassingNetworkData {
  team: "home" | "away";
  nodes: (PlayerPosition & { playerId: number; passCount: number })[];
  edges: PassingNetworkEdge[];
}

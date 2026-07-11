import type {
  AIEvaluation,
  Competition,
  MatchStats,
  MatchSummary,
  PassingNetworkData,
  Player,
} from "./types";

export const mockCompetitions: Competition[] = [
  { competitionId: 43, seasonId: 3, competitionName: "FIFA World Cup", countryName: "International", seasonName: "2022" },
  { competitionId: 16, seasonId: 4, competitionName: "Champions League", countryName: "Europe", seasonName: "2018/2019" },
  { competitionId: 11, seasonId: 90, competitionName: "La Liga", countryName: "Spain", seasonName: "2020/2021" },
];

export const mockMatches: Record<number, MatchSummary[]> = {
  43: [
    {
      matchId: 3869685,
      matchDate: "2022-12-18",
      competitionStage: "Final",
      homeTeam: { teamId: 1, teamName: "Argentina" },
      awayTeam: { teamId: 2, teamName: "France" },
      homeScore: 3,
      awayScore: 3,
    },
  ],
  16: [
    {
      matchId: 22912,
      matchDate: "2019-06-01",
      competitionStage: "Final",
      homeTeam: { teamId: 3, teamName: "Liverpool" },
      awayTeam: { teamId: 4, teamName: "Tottenham Hotspur" },
      homeScore: 2,
      awayScore: 0,
    },
  ],
  11: [
    {
      matchId: 303430,
      matchDate: "2021-03-06",
      competitionStage: "Matchday 27",
      homeTeam: { teamId: 5, teamName: "Barcelona" },
      awayTeam: { teamId: 6, teamName: "Real Madrid" },
      homeScore: 1,
      awayScore: 3,
    },
  ],
};

export const mockMatchStats: MatchStats = {
  homeXg: 2.43,
  awayXg: 2.17,
  homePossession: 58,
  awayPossession: 42,
};

export const mockAIEvaluation: AIEvaluation = {
  matchId: 3869685,
  storyline:
    "A 2-0 cushion evaporated in six second-half minutes, and the game that followed belonged to penalties and one man's will to force it there.",
  summary:
    "Argentina controlled tempo through Mac Allister and De Paul in midfield, compressing France into deep blocks and starving Mbappe of service for 78 minutes. A double substitution shift from Deschamps flipped the geometry of the game, and two Mbappe strikes inside 97 seconds turned a comfortable win into a survival act that stretched to extra time and penalties.",
  strengths: {
    home: [
      "Midfield press won the ball in dangerous zones 14 times, more than any France match this tournament",
      "Di Maria's early breakthrough came from a rehearsed left-side overload, isolating France's right back",
      "Set piece delivery from Messi created three clear chances in open play spells",
    ],
    away: [
      "Mbappe converted twice inside 97 seconds once given service in transition, elite chance conversion under pressure",
      "Deschamps' triple substitution at halftime reshaped the game's geometry and created the platform for the comeback",
    ],
  },
  weaknesses: {
    home: [
      "Dropped a 2-0 lead in the final 15 minutes as legs tired and the back line lost its shape",
      "Struggled to control Mbappe once France pushed fullbacks higher after the 70th minute",
      "Failed to close out the game from a winning penalty shootout position early",
    ],
    away: [
      "Created almost nothing in open play for the first 78 minutes, starved of service to Mbappe",
      "Conceded from a self-inflicted penalty in extra time, undoing the momentum from the equalizer",
    ],
  },
  keyMoments: [
    { minute: 23, team: "home", type: "goal", description: "Messi converts from the penalty spot after a coordinated press forces the foul." },
    { minute: 36, team: "home", type: "goal", description: "Di Maria finishes a rapid counter-attack to make it 2-0." },
    { minute: 41, team: "away", type: "tactical-shift", description: "Deschamps prepares a triple substitution at the break." },
    { minute: 80, team: "away", type: "goal", description: "Mbappe converts a penalty won moments after coming inside." },
    { minute: 81, team: "away", type: "goal", description: "Mbappe volleys home from the edge of the box to level the match." },
    { minute: 108, team: "home", type: "goal", description: "Messi restores Argentina's lead in extra time." },
    { minute: 118, team: "away", type: "goal", description: "Mbappe completes his hat-trick from the penalty spot." },
  ],
  generatedAt: "2026-07-01T10:00:00Z",
};

export const mockPlayers: Player[] = [
  {
    playerId: 1, name: "Lionel Messi", team: "home", position: "RW", shirtNumber: 10, minutesPlayed: 120,
    stats: { goals: 2, assists: 1, passes: 61, passAccuracy: 88, xg: 1.32, xa: 0.41, touches: 74, tackles: 1, dribbles: 4 },
    averagePosition: { x: 68, y: 62 },
  },
  {
    playerId: 2, name: "Kylian Mbappe", team: "away", position: "ST", shirtNumber: 10, minutesPlayed: 120,
    stats: { goals: 3, assists: 0, passes: 24, passAccuracy: 79, xg: 2.1, xa: 0.12, touches: 41, tackles: 0, dribbles: 6 },
    averagePosition: { x: 78, y: 48 },
  },
  {
    playerId: 3, name: "Alexis Mac Allister", team: "home", position: "CM", shirtNumber: 20, minutesPlayed: 105,
    stats: { goals: 0, assists: 0, passes: 88, passAccuracy: 91, xg: 0.08, xa: 0.22, touches: 102, tackles: 3, dribbles: 1 },
    averagePosition: { x: 45, y: 50 },
  },
  {
    playerId: 4, name: "Angel Di Maria", team: "home", position: "LW", shirtNumber: 11, minutesPlayed: 64,
    stats: { goals: 1, assists: 1, passes: 33, passAccuracy: 84, xg: 0.61, xa: 0.38, touches: 45, tackles: 2, dribbles: 3 },
    averagePosition: { x: 62, y: 22 },
  },
];

export const mockPassingNetwork: PassingNetworkData = {
  team: "home",
  nodes: [
    { playerId: 1, x: 68, y: 62, passCount: 61 },
    { playerId: 3, x: 45, y: 50, passCount: 88 },
    { playerId: 4, x: 62, y: 22, passCount: 33 },
    { playerId: 5, x: 30, y: 40, passCount: 54 },
    { playerId: 6, x: 20, y: 65, passCount: 47 },
  ],
  edges: [
    { fromPlayerId: 3, toPlayerId: 1, count: 18 },
    { fromPlayerId: 3, toPlayerId: 4, count: 12 },
    { fromPlayerId: 3, toPlayerId: 5, count: 22 },
    { fromPlayerId: 5, toPlayerId: 6, count: 15 },
    { fromPlayerId: 6, toPlayerId: 4, count: 9 },
    { fromPlayerId: 1, toPlayerId: 4, count: 11 },
  ],
};

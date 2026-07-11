"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchSelector } from "@/components/dashboard/MatchSelector";
import { MatchHeader } from "@/components/dashboard/MatchHeader";
import { TacticalAnalysisTab } from "@/components/dashboard/tabs/TacticalAnalysisTab";
import { VisualizationsTab } from "@/components/dashboard/tabs/VisualizationsTab";
import { PlayerAnalyticsTab } from "@/components/dashboard/tabs/PlayerAnalyticsTab";
import { useMatchPlayers } from "@/lib/api";
import {
  mockAIEvaluation,
  mockCompetitions,
  mockMatches,
  mockMatchStats,
  mockPlayers,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const [competitionId, setCompetitionId] = useState(mockCompetitions[0].competitionId);
  const matches = useMemo(() => mockMatches[competitionId] ?? [], [competitionId]);
  const [matchId, setMatchId] = useState(matches[0]?.matchId);

  const activeMatches = mockMatches[competitionId] ?? [];
  const match = activeMatches.find((m) => m.matchId === matchId) ?? activeMatches[0];

  // Real per-player touch data (heatmaps) — fetched once per match here and
  // shared by both tabs below, rather than each fetching independently.
  const { players: realPlayers, error: realPlayersError } = useMatchPlayers(match?.matchId ?? 0);

  function handleCompetitionChange(nextCompetitionId: number) {
    setCompetitionId(nextCompetitionId);
    const nextMatches = mockMatches[nextCompetitionId] ?? [];
    setMatchId(nextMatches[0]?.matchId);
  }

  if (!match) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center text-slate-400">
        No match available for this competition yet.
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-navy-950">
      <MatchSelector
        competitions={mockCompetitions}
        matches={activeMatches}
        selectedCompetitionId={competitionId}
        selectedMatchId={match.matchId}
        onCompetitionChange={handleCompetitionChange}
        onMatchChange={setMatchId}
      />

      <MatchHeader match={match} stats={mockMatchStats} />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <Tabs defaultValue="analysis">
          <TabsList>
            <TabsTrigger value="analysis">AI Tactical Analysis</TabsTrigger>
            <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
            <TabsTrigger value="players">Player Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis">
            <TacticalAnalysisTab
              evaluation={mockAIEvaluation}
              match={match}
              players={realPlayers}
              playersError={realPlayersError}
            />
          </TabsContent>

          <TabsContent value="visualizations">
            <VisualizationsTab match={match} players={realPlayers} playersError={realPlayersError} />
          </TabsContent>

          <TabsContent value="players">
            <PlayerAnalyticsTab players={mockPlayers} match={match} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

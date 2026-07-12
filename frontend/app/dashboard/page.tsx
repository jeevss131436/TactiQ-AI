"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchBar } from "@/components/dashboard/MatchBar";
import { MatchHeader } from "@/components/dashboard/MatchHeader";
import { MatchOverviewTab } from "@/components/dashboard/tabs/MatchOverviewTab";
import { TacticalAnalysisTab } from "@/components/dashboard/tabs/TacticalAnalysisTab";
import { VisualizationsTab } from "@/components/dashboard/tabs/VisualizationsTab";
import { PlayerAnalyticsTab } from "@/components/dashboard/tabs/PlayerAnalyticsTab";
import { useMatch, useMatchAnalytics, useMatchPlayers } from "@/lib/api";

// The dashboard renders whatever match is named in the `?match=<id>` query
// param — reachable for any of the ~4,000 games via the /matches search
// screen. Falls back to the 2022 World Cup final so a bare /dashboard link
// still lands on something.
const DEFAULT_MATCH_ID = 3869685;

function DashboardContent() {
  const searchParams = useSearchParams();
  const matchId = Number(searchParams.get("match")) || DEFAULT_MATCH_ID;

  // Match summary + header stats (possession, xG) — real, no LLM.
  const { data: matchData, error: matchError } = useMatch(matchId);

  // Real per-player data (heatmaps + player analytics), shared by all tabs.
  const { players: realPlayers, error: realPlayersError } = useMatchPlayers(matchId);

  // Real AI tactical evaluation (summary, strengths/weaknesses, turning points,
  // man of the match, storyline) — one Claude call per match, shared by the
  // Tactical Analysis and Player Analytics tabs.
  const { evaluation: realEvaluation, error: realEvaluationError } = useMatchAnalytics(matchId);

  if (matchError) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-6 py-24 text-center">
        <p className="text-sm text-signal-down">Could not load match {matchId}</p>
        <p className="text-xs text-slate-500">
          {matchError} — make sure the backend is running at{" "}
          <code className="font-mono text-slate-400">localhost:8000</code>.
        </p>
        <Link href="/matches" className="mt-2 text-sm text-cyan-400 hover:text-cyan-300">
          ← Back to match search
        </Link>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center gap-2 bg-navy-950 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading match…
      </div>
    );
  }

  const { match, stats } = matchData;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-navy-950">
      <MatchBar match={match} />
      <MatchHeader match={match} stats={stats} />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Match Overview</TabsTrigger>
            <TabsTrigger value="analysis">AI Tactical Analysis</TabsTrigger>
            <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
            <TabsTrigger value="players">Player Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <MatchOverviewTab match={match} teamStats={matchData.teamStats} />
          </TabsContent>

          <TabsContent value="analysis">
            <TacticalAnalysisTab
              evaluation={realEvaluation}
              evaluationError={realEvaluationError}
            />
          </TabsContent>

          <TabsContent value="visualizations">
            <VisualizationsTab match={match} players={realPlayers} playersError={realPlayersError} />
          </TabsContent>

          <TabsContent value="players">
            <PlayerAnalyticsTab
              players={realPlayers}
              playersError={realPlayersError}
              evaluation={realEvaluation}
              evaluationError={realEvaluationError}
              match={match}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center gap-2 bg-navy-950 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

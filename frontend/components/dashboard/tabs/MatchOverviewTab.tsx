"use client";

import { TeamComparison } from "@/components/dashboard/TeamComparison";
import { KeyMomentsTimeline } from "@/components/dashboard/KeyMomentsTimeline";
import { SubstitutionTimeline } from "@/components/dashboard/SubstitutionTimeline";
import { useMatchTimeline } from "@/lib/api";
import type { RealTeamStats } from "@/lib/api";
import type { MatchSummary } from "@/lib/types";

export function MatchOverviewTab({
  match,
  teamStats,
}: {
  match: MatchSummary;
  teamStats: { home: RealTeamStats; away: RealTeamStats };
}) {
  const { moments, error: momentsError } = useMatchTimeline(match.matchId);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TeamComparison match={match} home={teamStats.home} away={teamStats.away} />
      <KeyMomentsTimeline moments={moments} error={momentsError} match={match} />
      <div className="lg:col-span-2">
        <SubstitutionTimeline moments={moments} error={momentsError} match={match} />
      </div>
    </div>
  );
}

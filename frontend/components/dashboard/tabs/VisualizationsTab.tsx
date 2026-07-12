"use client";

import { TeamHeatmapCard } from "@/components/dashboard/TeamHeatmapCard";
import { PassingNetworkCard } from "@/components/dashboard/PassingNetworkCard";
import { FormationCard } from "@/components/dashboard/FormationCard";
import { Shots3DCard } from "@/components/dashboard/Shots3DCard";
import { useMatchPassingNetwork, useMatchShots } from "@/lib/api";
import type { RealPlayerTouches } from "@/lib/api";
import type { MatchSummary } from "@/lib/types";

export function VisualizationsTab({
  match,
  players,
  playersError,
}: {
  match: MatchSummary;
  players: RealPlayerTouches[] | null;
  playersError: string | null;
}) {
  const { networks, error: networksError } = useMatchPassingNetwork(match.matchId);
  const { shots, error: shotsError } = useMatchShots(match.matchId);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <FormationCard
        teamName={match.homeTeam.teamName}
        homeOrAway="home"
        players={players}
        error={playersError}
      />
      <FormationCard
        teamName={match.awayTeam.teamName}
        homeOrAway="away"
        players={players}
        error={playersError}
      />

      <TeamHeatmapCard
        teamName={match.homeTeam.teamName}
        homeOrAway="home"
        players={players}
        error={playersError}
      />
      <TeamHeatmapCard
        teamName={match.awayTeam.teamName}
        homeOrAway="away"
        players={players}
        error={playersError}
      />

      <PassingNetworkCard
        teamName={match.homeTeam.teamName}
        homeOrAway="home"
        networks={networks}
        error={networksError}
      />
      <PassingNetworkCard
        teamName={match.awayTeam.teamName}
        homeOrAway="away"
        networks={networks}
        error={networksError}
      />

      <Shots3DCard match={match} shots={shots} error={shotsError} />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PitchHeatmap } from "@/components/dashboard/PitchHeatmap";
import type { RealPlayerTouches } from "@/lib/api";

const WHOLE_TEAM_VALUE = "__team__";

interface TeamHeatmapCardProps {
  teamName: string;
  homeOrAway: "home" | "away";
  players: RealPlayerTouches[] | null;
  error: string | null;
  // Visualizations tab lets you drill into individual players; the Tactical
  // Analysis tab just shows the real team-wide aggregate.
  showPlayerSelect?: boolean;
}

export function TeamHeatmapCard({
  teamName,
  homeOrAway,
  players,
  error,
  showPlayerSelect = true,
}: TeamHeatmapCardProps) {
  const [selected, setSelected] = useState(WHOLE_TEAM_VALUE);

  const teamPlayers = useMemo(
    () => (players ?? []).filter((p) => p.homeOrAway === homeOrAway),
    [players, homeOrAway]
  );

  const touches = useMemo(() => {
    if (selected === WHOLE_TEAM_VALUE) return teamPlayers.flatMap((p) => p.touchLocations);
    return teamPlayers.find((p) => String(p.playerId) === selected)?.touchLocations ?? [];
  }, [teamPlayers, selected]);

  const selectedName =
    selected === WHOLE_TEAM_VALUE
      ? "Whole team"
      : teamPlayers.find((p) => String(p.playerId) === selected)?.name;

  return (
    <Card>
      <CardHeader
        className={showPlayerSelect ? "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" : undefined}
      >
        <div>
          <CardTitle>Movement Heatmap — {teamName}</CardTitle>
          <CardDescription>Touch density across the pitch, from real event data</CardDescription>
        </div>
        {showPlayerSelect && players && players.length > 0 && (
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Whole team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={WHOLE_TEAM_VALUE}>Whole team</SelectItem>
              {teamPlayers.map((p) => (
                <SelectItem key={p.playerId} value={String(p.playerId)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {error && (
          <div className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-2 rounded-lg bg-navy-950/60 text-center">
            <p className="text-sm text-signal-down">Could not load real match data</p>
            <p className="max-w-sm text-xs text-slate-500">
              {error} — make sure the backend is running at{" "}
              <code className="font-mono text-slate-400">localhost:8000</code>.
            </p>
          </div>
        )}
        {!error && !players && (
          <div className="flex aspect-[3/2] w-full items-center justify-center rounded-lg bg-navy-950/60">
            <p className="text-sm text-slate-500">Loading real match data…</p>
          </div>
        )}
        {!error && players && (
          <>
            <PitchHeatmap
              touches={touches}
              emptyMessage={
                selected === WHOLE_TEAM_VALUE ? "No touch data for this team" : "Did not appear in this match"
              }
            />
            {showPlayerSelect && (
              <p className="mt-3 text-center text-xs text-slate-500">
                {selectedName} · {touches.length} touches
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

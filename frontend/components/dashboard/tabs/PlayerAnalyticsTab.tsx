"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Badge } from "@/components/ui/badge";
import type { MatchSummary, Player } from "@/lib/types";

export function PlayerAnalyticsTab({
  players,
  match,
}: {
  players: Player[];
  match: MatchSummary;
}) {
  const [selectedId, setSelectedId] = useState<number>(players[0]?.playerId ?? 0);
  const selected = players.find((p) => p.playerId === selectedId) ?? players[0];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {players.map((player) => (
          <button
            key={player.playerId}
            onClick={() => setSelectedId(player.playerId)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors",
              selectedId === player.playerId
                ? "border-cyan-500/50 bg-cyan-500/10 shadow-glow-sm"
                : "border-navy-700 bg-navy-900/60 hover:border-cyan-500/30"
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="font-mono text-lg font-semibold text-cyan-400">
                {player.shirtNumber}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {player.team === "home" ? match.homeTeam.teamName : match.awayTeam.teamName}
              </Badge>
            </div>
            <span className="font-display text-sm font-medium leading-tight text-white">
              {player.name}
            </span>
            <span className="text-xs text-slate-500">{player.position}</span>
          </button>
        ))}
      </div>

      {selected && (
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{selected.name}</CardTitle>
            <CardDescription>
              {selected.position} · {selected.minutesPlayed}&apos; played
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-6 pt-0">
            <Stat label="Goals" value={selected.stats.goals} />
            <Stat label="Assists" value={selected.stats.assists} />
            <Stat label="xG" value={selected.stats.xg.toFixed(2)} />
            <Stat label="xA" value={selected.stats.xa.toFixed(2)} />
            <Stat label="Passes" value={selected.stats.passes} />
            <Stat label="Pass Acc." value={`${selected.stats.passAccuracy}%`} />
            <Stat label="Touches" value={selected.stats.touches} />
            <Stat label="Dribbles" value={selected.stats.dribbles} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

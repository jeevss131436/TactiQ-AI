"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PitchOutline } from "@/components/dashboard/PitchOutline";
import type { RealPlayerTouches } from "@/lib/api";

// StatsBomb's native pitch dimensions — average positions arrive in these units
// and normalize into the 0-100% render box over the PitchOutline.
const PITCH_LENGTH = 120;
const PITCH_WIDTH = 80;

function surname(name: string): string {
  const parts = name.trim().split(" ");
  return parts[parts.length - 1];
}

export function FormationCard({
  teamName,
  homeOrAway,
  players,
  error,
}: {
  teamName: string;
  homeOrAway: "home" | "away";
  players: RealPlayerTouches[] | null;
  error: string | null;
}) {
  // Starting XI for this team, positioned at each player's mean touch location.
  const starters = useMemo(
    () =>
      (players ?? []).filter(
        (p) => p.homeOrAway === homeOrAway && p.isStarter && p.averagePosition
      ),
    [players, homeOrAway]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formation — {teamName}</CardTitle>
        <CardDescription>Starting XI at average position (mean of each player&apos;s touches)</CardDescription>
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
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg bg-navy-950/60">
            <PitchOutline className="pointer-events-none absolute inset-0 opacity-50" />
            {starters.map((p) => {
              const left = `${(p.averagePosition!.x / PITCH_LENGTH) * 100}%`;
              const top = `${(p.averagePosition!.y / PITCH_WIDTH) * 100}%`;
              return (
                <div
                  key={p.playerId}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left, top }}
                  title={`${p.name} · ${p.position ?? ""}`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-400/60 bg-cyan-500/25 font-mono text-[11px] font-semibold text-cyan-100">
                    {p.shirtNumber}
                  </span>
                  <span className="mt-0.5 max-w-[64px] truncate text-[9px] text-slate-300">
                    {surname(p.name)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

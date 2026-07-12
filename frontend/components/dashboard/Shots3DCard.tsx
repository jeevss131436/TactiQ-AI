"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Boxes } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { RealShot } from "@/lib/api";
import type { MatchSummary } from "@/lib/types";

// three.js touches `window` at import time, so the scene can only load in the
// browser — same pattern as the Plotly heatmap.
const ShotScene = dynamic(() => import("@/components/dashboard/ShotScene"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[3/2] w-full items-center justify-center rounded-lg bg-navy-950/60">
      <p className="text-sm text-slate-500">Loading 3D scene…</p>
    </div>
  ),
});

const HOME_COLOR = "#38bdf8";
const AWAY_COLOR = "#fbbf24";

interface Shots3DCardProps {
  match: MatchSummary;
  shots: RealShot[] | null;
  error: string | null;
}

export function Shots3DCard({ match, shots, error }: Shots3DCardProps) {
  const [goalsOnly, setGoalsOnly] = useState(false);

  const visible = useMemo(() => {
    if (!shots) return [];
    return goalsOnly ? shots.filter((s) => s.isGoal) : shots;
  }, [shots, goalsOnly]);

  const goalCount = shots?.filter((s) => s.isGoal).length ?? 0;

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-cyan-400" />
            3D Shot Trajectories
          </CardTitle>
          <CardDescription>
            Every shot drawn from its real start to its 3D end point — drag to orbit the pitch
          </CardDescription>
        </div>
        {shots && shots.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: HOME_COLOR }} />
                {match.homeTeam.teamName}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: AWAY_COLOR }} />
                {match.awayTeam.teamName}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setGoalsOnly((v) => !v)}
              className={
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors " +
                (goalsOnly
                  ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-100"
                  : "border-navy-700 text-slate-400 hover:text-slate-200")
              }
            >
              Goals only ({goalCount})
            </button>
          </div>
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
        {!error && !shots && (
          <div className="flex aspect-[3/2] w-full items-center justify-center rounded-lg bg-navy-950/60">
            <p className="text-sm text-slate-500">Loading real match data…</p>
          </div>
        )}
        {!error && shots && (
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg bg-navy-950/60">
            <ShotScene shots={visible} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

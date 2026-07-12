import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RealKeyMoment } from "@/lib/api";
import type { MatchSummary } from "@/lib/types";

function SubPill({ sub, side }: { sub: RealKeyMoment; side: "home" | "away" }) {
  return (
    <div
      className="flex min-w-[8.5rem] flex-col gap-1 rounded-md border border-navy-700 bg-navy-900/60 p-2.5"
      title={`${sub.minute}' — ${sub.playerOn} on for ${sub.playerOff}`}
    >
      <span
        className={cn(
          "font-mono text-[11px]",
          side === "home" ? "text-cyan-400" : "text-slate-400"
        )}
      >
        {sub.minute}&apos;
      </span>
      <span className="truncate text-xs text-signal-up">▲ {sub.playerOn}</span>
      <span className="truncate text-xs text-slate-500">▼ {sub.playerOff}</span>
    </div>
  );
}

function TeamLane({
  label,
  subs,
  side,
}: {
  label: string;
  subs: RealKeyMoment[];
  side: "home" | "away";
}) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className={cn(
          "text-xs font-medium",
          side === "home" ? "text-cyan-400" : "text-slate-400"
        )}
      >
        {label}
      </span>
      {subs.length === 0 ? (
        <p className="text-xs text-slate-600">No substitutions</p>
      ) : (
        <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
          {subs.map((sub, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="h-3 w-3 shrink-0 text-navy-700" />}
              <SubPill sub={sub} side={side} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SubstitutionTimeline({
  moments,
  error,
  match,
}: {
  moments: RealKeyMoment[] | null;
  error: string | null;
  match: MatchSummary;
}) {
  const subs = useMemo(() => (moments ?? []).filter((m) => m.type === "substitution"), [moments]);
  // Already chronological from the backend; keep home/away split, earliest first.
  const home = subs.filter((s) => s.homeOrAway === "home");
  const away = subs.filter((s) => s.homeOrAway === "away");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Substitution Timeline</CardTitle>
        <CardDescription>Each change in order — minute, who came on (▲) and who came off (▼)</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {error && <p className="text-sm text-signal-down">Could not load substitutions — {error}</p>}
        {!error && !moments && <p className="text-sm text-slate-500">Loading substitutions…</p>}
        {!error && moments && subs.length === 0 && (
          <p className="text-sm text-slate-500">No substitutions recorded for this match.</p>
        )}
        {!error && subs.length > 0 && (
          <div className="flex flex-col gap-6">
            <TeamLane label={match.homeTeam.teamName} subs={home} side="home" />
            <TeamLane label={match.awayTeam.teamName} subs={away} side="away" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

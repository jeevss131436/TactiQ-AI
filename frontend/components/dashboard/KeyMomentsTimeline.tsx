import { Goal, Target, Square, ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { KeyMomentType, RealKeyMoment } from "@/lib/api";
import type { MatchSummary } from "@/lib/types";

function MomentIcon({ type }: { type: KeyMomentType }) {
  switch (type) {
    case "goal":
      return <Goal className="h-4 w-4 text-cyan-400" />;
    case "big_chance":
      return <Target className="h-4 w-4 text-cyan-300" />;
    case "yellow_card":
      return <Square className="h-4 w-4 fill-yellow-400 text-yellow-400" />;
    case "red_card":
      return <Square className="h-4 w-4 fill-signal-down text-signal-down" />;
    case "substitution":
      return <ArrowLeftRight className="h-4 w-4 text-slate-400" />;
  }
}

export function KeyMomentsTimeline({
  moments,
  error,
  match,
}: {
  moments: RealKeyMoment[] | null;
  error: string | null;
  match: MatchSummary;
}) {
  const teamName = (side: "home" | "away") =>
    side === "home" ? match.homeTeam.teamName : match.awayTeam.teamName;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Moments</CardTitle>
        <CardDescription>Goals, chances, cards and subs — auto-extracted from event data</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {error && <p className="text-sm text-signal-down">Could not load timeline — {error}</p>}
        {!error && !moments && <p className="text-sm text-slate-500">Loading key moments…</p>}
        {!error && moments && moments.length === 0 && (
          <p className="text-sm text-slate-500">No key moments recorded for this match.</p>
        )}
        {!error && moments && moments.length > 0 && (
          <ol className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto pr-1">
            {moments.map((m, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-9 shrink-0 pt-0.5 text-right font-mono text-xs text-cyan-400">
                  {m.minute}&apos;
                </span>
                <span className="pt-0.5">
                  <MomentIcon type={m.type} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200">{m.description}</p>
                  <p
                    className={cn(
                      "text-xs",
                      m.homeOrAway === "home" ? "text-cyan-400/70" : "text-slate-500"
                    )}
                  >
                    {teamName(m.homeOrAway)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

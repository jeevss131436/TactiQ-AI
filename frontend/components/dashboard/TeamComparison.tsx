import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { RealTeamStats } from "@/lib/api";
import type { MatchSummary } from "@/lib/types";

interface Row {
  label: string;
  home: number;
  away: number;
  format?: (v: number) => string;
}

function ComparisonRow({ label, home, away, format }: Row) {
  const fmt = format ?? ((v: number) => String(v));
  const total = home + away;
  // Split the bar proportionally; fall back to 50/50 when neither team
  // recorded the stat so the row still renders cleanly.
  const homePct = total > 0 ? (home / total) * 100 : 50;
  const awayPct = 100 - homePct;
  const homeLeads = home >= away;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between font-mono text-sm">
        <span className={homeLeads ? "text-white" : "text-slate-400"}>{fmt(home)}</span>
        <span className="text-xs uppercase tracking-wider text-slate-500">{label}</span>
        <span className={!homeLeads ? "text-white" : "text-slate-400"}>{fmt(away)}</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-navy-800">
        <div className="h-full bg-cyan-500" style={{ width: `${homePct}%` }} />
        <div className="h-full bg-slate-500" style={{ width: `${awayPct}%` }} />
      </div>
    </div>
  );
}

export function TeamComparison({
  match,
  home,
  away,
}: {
  match: MatchSummary;
  home: RealTeamStats;
  away: RealTeamStats;
}) {
  const rows: Row[] = [
    { label: "Possession", home: home.possessionPct, away: away.possessionPct, format: (v) => `${Math.round(v)}%` },
    { label: "xG", home: home.totalXg, away: away.totalXg, format: (v) => v.toFixed(2) },
    { label: "Shots", home: home.totalShots, away: away.totalShots },
    { label: "Passes", home: home.passes, away: away.passes },
    { label: "Duels won", home: home.duelsWon, away: away.duelsWon },
    { label: "Touches", home: home.touches, away: away.touches },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Comparison</CardTitle>
        <CardDescription>
          <span className="text-cyan-400">{match.homeTeam.teamName}</span> vs{" "}
          <span className="text-slate-400">{match.awayTeam.teamName}</span> — computed from real event data
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        {rows.map((r) => (
          <ComparisonRow key={r.label} {...r} />
        ))}
      </CardContent>
    </Card>
  );
}

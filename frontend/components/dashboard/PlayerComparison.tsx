import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PitchHeatmap } from "@/components/dashboard/PitchHeatmap";
import { cn } from "@/lib/utils";
import type { RealPlayerTouches } from "@/lib/api";

interface StatRow {
  label: string;
  a: number;
  b: number;
  format?: (v: number) => string;
}

function CompareRow({ label, a, b, format }: StatRow) {
  const fmt = format ?? ((v: number) => String(v));
  const aLeads = a > b;
  const bLeads = b > a;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-1.5">
      <span
        className={cn(
          "text-right font-mono text-sm tabular-nums",
          aLeads ? "font-semibold text-cyan-300" : "text-slate-400"
        )}
      >
        {fmt(a)}
      </span>
      <span className="text-center text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <span
        className={cn(
          "font-mono text-sm tabular-nums",
          bLeads ? "font-semibold text-amber-300" : "text-slate-400"
        )}
      >
        {fmt(b)}
      </span>
    </div>
  );
}

export function PlayerComparison({
  a,
  b,
}: {
  a: RealPlayerTouches;
  b: RealPlayerTouches;
}) {
  const rows: StatRow[] = [
    { label: "Goals", a: a.stats.goals, b: b.stats.goals },
    { label: "Assists", a: a.stats.assists, b: b.stats.assists },
    { label: "xG", a: a.stats.xg, b: b.stats.xg, format: (v) => v.toFixed(2) },
    { label: "xA", a: a.stats.xa, b: b.stats.xa, format: (v) => v.toFixed(2) },
    { label: "Passes", a: a.stats.passes, b: b.stats.passes },
    { label: "Pass %", a: a.stats.passAccuracy, b: b.stats.passAccuracy, format: (v) => `${v}%` },
    { label: "Touches", a: a.stats.touches, b: b.stats.touches },
    { label: "Tackles", a: a.stats.tackles, b: b.stats.tackles },
    { label: "Dribbles", a: a.stats.dribbles, b: b.stats.dribbles },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="text-right">
            <CardTitle className="text-cyan-300">{a.name}</CardTitle>
            <p className="text-xs text-slate-500">{a.position ?? "—"} · {a.teamName}</p>
          </div>
          <Badge variant="outline" className="text-[10px]">vs</Badge>
          <div>
            <CardTitle className="text-amber-300">{b.name}</CardTitle>
            <p className="text-xs text-slate-500">{b.position ?? "—"} · {b.teamName}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 pt-0">
        <div className="divide-y divide-navy-800">
          {rows.map((r) => (
            <CompareRow key={r.label} {...r} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-2 text-center text-xs text-slate-400">
              {a.name} · {a.touchLocations.length} touches
            </p>
            <PitchHeatmap touches={a.touchLocations} emptyMessage="No touch data" />
          </div>
          <div>
            <p className="mb-2 text-center text-xs text-slate-400">
              {b.name} · {b.touchLocations.length} touches
            </p>
            <PitchHeatmap touches={b.touchLocations} emptyMessage="No touch data" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

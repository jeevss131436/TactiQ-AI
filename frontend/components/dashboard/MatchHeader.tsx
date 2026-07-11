import { Badge } from "@/components/ui/badge";
import type { MatchStats, MatchSummary } from "@/lib/types";

function PossessionBar({ home, away }: { home: number; away: number }) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex items-center justify-between font-mono text-sm">
        <span className="text-white">{home}%</span>
        <span className="text-xs uppercase tracking-wider text-slate-500">Possession</span>
        <span className="text-white">{away}%</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-navy-700">
        <div className="h-full bg-cyan-500" style={{ width: `${home}%` }} />
        <div className="h-full bg-slate-500" style={{ width: `${away}%` }} />
      </div>
    </div>
  );
}

export function MatchHeader({ match, stats }: { match: MatchSummary; stats: MatchStats }) {
  return (
    <div className="border-b border-navy-700/60 bg-navy-900/60">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Badge variant="outline">{match.competitionStage}</Badge>
          <Badge variant="outline">{match.matchDate}</Badge>
        </div>

        <div className="flex items-center justify-center gap-8 sm:gap-16">
          <div className="flex flex-1 flex-col items-end gap-1 text-right sm:flex-none sm:w-48">
            <span className="font-display text-xl font-semibold sm:text-2xl">{match.homeTeam.teamName}</span>
            <span className="font-mono text-xs text-slate-500">xG {stats.homeXg.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-3 font-display text-4xl font-bold sm:text-5xl">
            <span>{match.homeScore}</span>
            <span className="text-slate-600">–</span>
            <span>{match.awayScore}</span>
          </div>

          <div className="flex flex-1 flex-col items-start gap-1 sm:flex-none sm:w-48">
            <span className="font-display text-xl font-semibold sm:text-2xl">{match.awayTeam.teamName}</span>
            <span className="font-mono text-xs text-slate-500">xG {stats.awayXg.toFixed(2)}</span>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-md">
          <PossessionBar home={stats.homePossession} away={stats.awayPossession} />
        </div>
      </div>
    </div>
  );
}

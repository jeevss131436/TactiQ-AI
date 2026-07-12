import Link from "next/link";
import { Search } from "lucide-react";
import type { MatchSummary } from "@/lib/types";

// Compact context bar at the top of the dashboard — names the match being
// analyzed and links back to the search screen to pick another. Replaces the
// old hardcoded competition/match dropdowns now that any of the ~4,000 games
// is reachable.
export function MatchBar({ match }: { match: MatchSummary }) {
  const context = [match.competitionName, match.seasonName, match.competitionStage]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="border-b border-navy-700/60 bg-navy-900/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-medium text-white">
            {match.homeTeam.teamName} vs {match.awayTeam.teamName}
          </p>
          {context && <p className="truncate text-xs text-slate-500">{context}</p>}
        </div>
        <Link
          href="/matches"
          className="inline-flex shrink-0 items-center gap-2 rounded-md border border-navy-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-200"
        >
          <Search className="h-3.5 w-3.5" />
          Search matches
        </Link>
      </div>
    </div>
  );
}

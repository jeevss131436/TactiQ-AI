"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchMatches } from "@/lib/api";
import type { MatchSummary } from "@/lib/types";

const EXAMPLES = [
  "World Cup Final",
  "Barcelona Real Madrid",
  "Champions League",
  "Arsenal",
  "Women's Euro",
];

function MatchRow({ match }: { match: MatchSummary }) {
  const meta = [match.competitionName, match.seasonName, match.competitionStage]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link
      href={`/dashboard?match=${match.matchId}`}
      className="group flex items-center gap-4 rounded-lg border border-navy-700 bg-navy-900/60 p-4 transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/[0.04]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 font-display text-sm font-medium text-white sm:text-base">
          <span className="truncate">{match.homeTeam.teamName}</span>
          <span className="shrink-0 font-mono text-cyan-400">
            {match.homeScore}–{match.awayScore}
          </span>
          <span className="truncate">{match.awayTeam.teamName}</span>
        </div>
        {meta && <p className="mt-1 truncate text-xs text-slate-500">{meta}</p>}
      </div>
      <span className="hidden shrink-0 font-mono text-xs text-slate-500 sm:block">
        {match.matchDate}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition-colors group-hover:text-cyan-400" />
    </Link>
  );
}

export default function MatchSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MatchSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  // Debounced search — an empty query returns the most recent matches so the
  // screen is never blank.
  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(() => {
      searchMatches(query, 40)
        .then((data) => {
          if (id === reqId.current) {
            setResults(data);
            setError(null);
            setLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (id === reqId.current) {
            setError(err instanceof Error ? err.message : "Search failed");
            setLoading(false);
          }
        });
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const heading = useMemo(
    () => (query.trim() ? `Results for “${query.trim()}”` : "Recent matches"),
    [query]
  );

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-navy-950">
      <div className="absolute inset-x-0 top-0 h-64 bg-hero-glow" />
      <div className="relative mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">
            Match Explorer
          </p>
          <h1 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Search any match in the dataset
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-balance text-sm text-slate-400">
            Every game in the StatsBomb Open Data clone — ~4,000 matches across 24
            competitions. Pick one to see its AI tactical breakdown, heatmaps,
            passing networks, 3D shots, and player analytics.
          </p>
        </div>

        <div className="relative mt-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500" />
          )}
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by team, competition, or season…"
            className="h-12 pl-11 pr-11 text-base"
            aria-label="Search matches"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setQuery(ex)}
              className="rounded-full border border-navy-700 px-3 py-1 text-xs text-slate-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-200"
            >
              {ex}
            </button>
          ))}
        </div>

        <div className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-widest text-slate-500">
              {heading}
            </h2>
            {results && (
              <span className="font-mono text-xs text-slate-600">
                {results.length}
                {results.length === 40 ? "+" : ""} shown
              </span>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-navy-700 bg-navy-900/60 p-6 text-center">
              <p className="text-sm text-signal-down">Could not reach the backend</p>
              <p className="mt-1 text-xs text-slate-500">
                {error} — make sure it&apos;s running at{" "}
                <code className="font-mono text-slate-400">localhost:8000</code>.
              </p>
            </div>
          )}

          {!error && results && results.length === 0 && (
            <div className="rounded-lg border border-navy-700 bg-navy-900/60 p-8 text-center text-sm text-slate-500">
              No matches found. Try a team, competition, or season name.
            </div>
          )}

          {!error && !results && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading matches…
            </div>
          )}

          {!error && results && results.length > 0 && (
            <div className="flex flex-col gap-2">
              {results.map((m) => (
                <MatchRow key={m.matchId} match={m} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

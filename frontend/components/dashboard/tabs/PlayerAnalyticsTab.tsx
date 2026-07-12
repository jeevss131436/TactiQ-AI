"use client";

import { useMemo, useState } from "react";
import { Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stat } from "@/components/ui/stat";
import { Badge } from "@/components/ui/badge";
import { PlayerComparison } from "@/components/dashboard/PlayerComparison";
import type { RealAIEvaluation, RealPlayerTouches } from "@/lib/api";
import type { MatchSummary } from "@/lib/types";

const NO_COMPARE = "__none__";

export function PlayerAnalyticsTab({
  players,
  playersError,
  evaluation,
  evaluationError,
  match,
}: {
  players: RealPlayerTouches[] | null;
  playersError: string | null;
  evaluation: RealAIEvaluation | null;
  evaluationError: string | null;
  match: MatchSummary;
}) {
  // Everyone who actually featured — unused subs (0 minutes) are dropped.
  // Grouped home-then-away, in shirt-number order, so the roster reads like a
  // team sheet.
  const rostered = useMemo(() => {
    return (players ?? [])
      .filter((p) => p.minutesPlayed > 0)
      .sort((a, b) => {
        if (a.homeOrAway !== b.homeOrAway) return a.homeOrAway === "home" ? -1 : 1;
        return a.shirtNumber - b.shirtNumber;
      });
  }, [players]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected =
    rostered.find((p) => p.playerId === selectedId) ?? rostered[0] ?? null;

  // Optional second player for the side-by-side comparison. Guarded so a player
  // is never compared with themselves (e.g. after picking a new primary).
  const [compareId, setCompareId] = useState<number | null>(null);
  const compareWith =
    compareId && compareId !== selected?.playerId
      ? rostered.find((p) => p.playerId === compareId) ?? null
      : null;

  // The AI's man-of-the-match pick is a player name; link it back to the
  // rostered player so we can badge their card and show their real numbers.
  const mvpPlayer = useMemo(
    () => (evaluation ? rostered.find((p) => p.name === evaluation.mvp) : undefined),
    [evaluation, rostered]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* AI-generated storyline + man of the match — one structured Claude call,
          reasoned over the same real stats shown below. */}
      <div className="lg:col-span-3 grid gap-6 md:grid-cols-2">
        <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-navy-900/60">
          <CardContent className="flex gap-4 p-6">
            <Sparkles className="mt-1 h-5 w-5 shrink-0 text-cyan-400" />
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-cyan-400/80">
                Match Storyline
              </span>
              {evaluationError && (
                <p className="text-sm text-signal-down">
                  Could not load AI analysis — {evaluationError}
                </p>
              )}
              {!evaluationError && !evaluation && (
                <p className="text-sm text-slate-500">Generating AI storyline…</p>
              )}
              {evaluation && (
                <p className="font-display text-lg leading-snug text-white">
                  {evaluation.matchStorylineHeadline}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Trophy className="h-4 w-4 text-cyan-400" />
            <CardTitle className="text-base">Man of the Match</CardTitle>
            <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-500">
              AI-selected
            </span>
          </CardHeader>
          <CardContent className="pt-0">
            {evaluationError && (
              <p className="text-sm text-signal-down">Could not load AI analysis.</p>
            )}
            {!evaluationError && !evaluation && (
              <p className="text-sm text-slate-500">Reasoning over match stats…</p>
            )}
            {evaluation && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-semibold text-white">
                    {evaluation.mvp}
                  </span>
                  {mvpPlayer && (
                    <Badge variant="outline" className="text-[10px]">
                      {mvpPlayer.teamName}
                    </Badge>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-slate-300">
                  {evaluation.manOfTheMatchReasoning}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Roster — click any player to see their real match stat line. */}
      <div className="lg:col-span-2">
        {playersError && (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg bg-navy-950/60 text-center">
            <p className="text-sm text-signal-down">Could not load real player data</p>
            <p className="max-w-sm text-xs text-slate-500">
              {playersError} — make sure the backend is running at{" "}
              <code className="font-mono text-slate-400">localhost:8000</code>.
            </p>
          </div>
        )}
        {!playersError && !players && (
          <div className="flex h-40 items-center justify-center rounded-lg bg-navy-950/60">
            <p className="text-sm text-slate-500">Loading real player data…</p>
          </div>
        )}
        {!playersError && players && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {rostered.map((player) => (
              <button
                key={player.playerId}
                onClick={() => setSelectedId(player.playerId)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors",
                  selected?.playerId === player.playerId
                    ? "border-cyan-500/50 bg-cyan-500/10 shadow-glow-sm"
                    : "border-navy-700 bg-navy-900/60 hover:border-cyan-500/30"
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-mono text-lg font-semibold text-cyan-400">
                    {player.shirtNumber}
                  </span>
                  {mvpPlayer?.playerId === player.playerId ? (
                    <Trophy className="h-3.5 w-3.5 text-cyan-400" />
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      {player.homeOrAway === "home"
                        ? match.homeTeam.teamName
                        : match.awayTeam.teamName}
                    </Badge>
                  )}
                </div>
                <span className="font-display text-sm font-medium leading-tight text-white">
                  {player.name}
                </span>
                <span className="text-xs text-slate-500">{player.position ?? "—"}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right column: compare control + the selected player's stat line (the
          single card gives way to the side-by-side view once a second player
          is chosen). */}
      {selected && (
        <div className="flex flex-col gap-4">
          {rostered.length > 1 && (
            <div className="rounded-lg border border-navy-700 bg-navy-900/60 p-4">
              <label className="mb-2 block text-xs uppercase tracking-wider text-slate-500">
                Compare {selected.name} with
              </label>
              <Select
                value={compareWith ? String(compareWith.playerId) : NO_COMPARE}
                onValueChange={(v) => setCompareId(v === NO_COMPARE ? null : Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a player" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_COMPARE}>No comparison</SelectItem>
                  {rostered
                    .filter((p) => p.playerId !== selected.playerId)
                    .map((p) => (
                      <SelectItem key={p.playerId} value={String(p.playerId)}>
                        {p.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!compareWith && (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>{selected.name}</CardTitle>
                <CardDescription>
                  {selected.position ?? "—"} · {selected.teamName} · {selected.minutesPlayed}&apos; played
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
                <Stat label="Tackles" value={selected.stats.tackles} />
                <Stat label="Dribbles" value={selected.stats.dribbles} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {selected && compareWith && (
        <div className="lg:col-span-3">
          <PlayerComparison a={selected} b={compareWith} />
        </div>
      )}
    </div>
  );
}

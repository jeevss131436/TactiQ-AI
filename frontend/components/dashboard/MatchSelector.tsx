"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Competition, MatchSummary } from "@/lib/types";

interface MatchSelectorProps {
  competitions: Competition[];
  matches: MatchSummary[];
  selectedCompetitionId: number;
  selectedMatchId: number;
  onCompetitionChange: (competitionId: number) => void;
  onMatchChange: (matchId: number) => void;
}

export function MatchSelector({
  competitions,
  matches,
  selectedCompetitionId,
  selectedMatchId,
  onCompetitionChange,
  onMatchChange,
}: MatchSelectorProps) {
  const selectedCompetition = competitions.find((c) => c.competitionId === selectedCompetitionId);

  return (
    <div className="border-b border-navy-700/60 bg-navy-900/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Competition
          </label>
          <Select
            value={String(selectedCompetitionId)}
            onValueChange={(v) => onCompetitionChange(Number(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select competition" />
            </SelectTrigger>
            <SelectContent>
              {competitions.map((c) => (
                <SelectItem key={c.competitionId} value={String(c.competitionId)}>
                  {c.competitionName} · {c.seasonName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Season / Stage
          </label>
          <Select value={selectedCompetition?.seasonName ?? ""} disabled>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Season" />
            </SelectTrigger>
            <SelectContent>
              {selectedCompetition && (
                <SelectItem value={selectedCompetition.seasonName}>
                  {selectedCompetition.seasonName}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Match
          </label>
          <Select
            value={String(selectedMatchId)}
            onValueChange={(v) => onMatchChange(Number(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select match" />
            </SelectTrigger>
            <SelectContent>
              {matches.map((m) => (
                <SelectItem key={m.matchId} value={String(m.matchId)}>
                  {m.homeTeam.teamName} vs {m.awayTeam.teamName} — {m.competitionStage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

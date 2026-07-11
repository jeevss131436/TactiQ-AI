import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamHeatmapCard } from "@/components/dashboard/TeamHeatmapCard";
import type { RealPlayerTouches } from "@/lib/api";
import type { AIEvaluation, MatchSummary } from "@/lib/types";

const momentTypeLabel: Record<string, string> = {
  goal: "Goal",
  card: "Card",
  substitution: "Sub",
  "tactical-shift": "Tactical shift",
  chance: "Chance",
};

function TeamEvaluationCard({
  teamName,
  strengths,
  weaknesses,
}: {
  teamName: string;
  strengths: string[];
  weaknesses: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{teamName}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-0">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-signal-up">
            <TrendingUp className="h-3.5 w-3.5" /> Strengths
          </p>
          <ul className="flex flex-col gap-2">
            {strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal-up" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-signal-down">
            <TrendingDown className="h-3.5 w-3.5" /> Weaknesses
          </p>
          <ul className="flex flex-col gap-2">
            {weaknesses.map((w, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal-down" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export function TacticalAnalysisTab({
  evaluation,
  match,
  players,
  playersError,
}: {
  evaluation: AIEvaluation;
  match: MatchSummary;
  players: RealPlayerTouches[] | null;
  playersError: string | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-navy-900/60">
          <CardContent className="flex gap-4 p-6">
            <Sparkles className="mt-1 h-5 w-5 shrink-0 text-cyan-400" />
            <p className="font-display text-lg leading-snug text-white">
              {evaluation.storyline}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Match Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[0.95rem] leading-relaxed text-slate-300">
              {evaluation.summary}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 sm:grid-cols-2">
          <TeamEvaluationCard
            teamName={match.homeTeam.teamName}
            strengths={evaluation.strengths.home}
            weaknesses={evaluation.weaknesses.home}
          />
          <TeamEvaluationCard
            teamName={match.awayTeam.teamName}
            strengths={evaluation.strengths.away}
            weaknesses={evaluation.weaknesses.away}
          />
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Key Moments</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ol className="relative flex flex-col gap-6 border-l border-navy-700 pl-6">
            {evaluation.keyMoments.map((moment, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full border-2 border-navy-950 bg-cyan-400" />
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-cyan-400">{moment.minute}&apos;</span>
                  <Badge variant="outline" className="text-[10px]">
                    {momentTypeLabel[moment.type]}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {moment.team === "home" ? match.homeTeam.teamName : match.awayTeam.teamName}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-300">{moment.description}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="lg:col-span-3 grid gap-6 sm:grid-cols-2">
        <TeamHeatmapCard
          teamName={match.homeTeam.teamName}
          homeOrAway="home"
          players={players}
          error={playersError}
          showPlayerSelect={false}
        />
        <TeamHeatmapCard
          teamName={match.awayTeam.teamName}
          homeOrAway="away"
          players={players}
          error={playersError}
          showPlayerSelect={false}
        />
      </div>
    </div>
  );
}

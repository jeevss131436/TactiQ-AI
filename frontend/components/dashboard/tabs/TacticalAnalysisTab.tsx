import { TrendingUp, TrendingDown, Sparkles, Waypoints, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RealAIEvaluation } from "@/lib/api";

function BulletList({
  items,
  tone,
}: {
  items: string[];
  tone: "up" | "down" | "neutral";
}) {
  const dot =
    tone === "up" ? "bg-signal-up" : tone === "down" ? "bg-signal-down" : "bg-cyan-400";
  return (
    <ul className="flex flex-col gap-2">
      {items.map((s, i) => (
        <li key={i} className="flex gap-2 text-sm text-slate-300">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
          {s}
        </li>
      ))}
    </ul>
  );
}

function LoadingState() {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg bg-navy-950/60">
      <p className="text-sm text-slate-500">Generating AI tactical analysis — this may take a moment as it generates…</p>
    </div>
  );
}

export function TacticalAnalysisTab({
  evaluation,
  evaluationError,
}: {
  evaluation: RealAIEvaluation | null;
  evaluationError: string | null;
}) {
  if (evaluationError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg bg-navy-950/60 text-center">
        <p className="text-sm text-signal-down">Could not generate AI analysis</p>
        <p className="max-w-md text-xs text-slate-500">
          {evaluationError} — make sure the backend is running at{" "}
          <code className="font-mono text-slate-400">localhost:8000</code> with an
          <code className="font-mono text-slate-400"> ANTHROPIC_API_KEY</code> set.
        </p>
      </div>
    );
  }

  if (!evaluation) return <LoadingState />;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-navy-900/60">
          <CardContent className="flex gap-4 p-6">
            <Sparkles className="mt-1 h-5 w-5 shrink-0 text-cyan-400" />
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-cyan-400/80">
                Match Storyline
              </span>
              <p className="font-display text-lg leading-snug text-white">
                {evaluation.matchStorylineHeadline}
              </p>
            </div>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-signal-up">
                <TrendingUp className="h-4 w-4" /> Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <BulletList items={evaluation.strengths} tone="up" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-signal-down">
                <TrendingDown className="h-4 w-4" /> Weaknesses
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <BulletList items={evaluation.weaknesses} tone="down" />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Waypoints className="h-4 w-4 text-cyan-400" /> Turning Points
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ol className="relative flex flex-col gap-5 border-l border-navy-700 pl-6">
              {evaluation.turningPoints.map((moment, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full border-2 border-navy-950 bg-cyan-400" />
                  <p className="text-sm text-slate-300">{moment}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {evaluation.keyStatCallouts.length > 0 && (
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cyan-400" /> Key Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <BulletList items={evaluation.keyStatCallouts} tone="neutral" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

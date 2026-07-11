import { Boxes } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PitchOutline } from "@/components/dashboard/PitchOutline";
import { TeamHeatmapCard } from "@/components/dashboard/TeamHeatmapCard";
import { mockPassingNetwork } from "@/lib/mock-data";
import type { RealPlayerTouches } from "@/lib/api";
import type { MatchSummary } from "@/lib/types";

function PassingNetwork() {
  const { nodes, edges } = mockPassingNetwork;
  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg bg-navy-950/60">
      <PitchOutline />
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        {edges.map((edge, i) => {
          const from = nodes.find((n) => n.playerId === edge.fromPlayerId);
          const to = nodes.find((n) => n.playerId === edge.toPlayerId);
          if (!from || !to) return null;
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="rgba(0,180,216,0.4)"
              strokeWidth={Math.max(0.3, edge.count / 25)}
            />
          );
        })}
      </svg>
      {nodes.map((n) => (
        <div
          key={n.playerId}
          className="absolute flex items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 font-mono text-[10px] text-cyan-200"
          style={{
            left: `${n.x}%`,
            top: `${n.y}%`,
            width: `${16 + n.passCount / 6}px`,
            height: `${16 + n.passCount / 6}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {n.passCount}
        </div>
      ))}
    </div>
  );
}

export function VisualizationsTab({
  match,
  players,
  playersError,
}: {
  match: MatchSummary;
  players: RealPlayerTouches[] | null;
  playersError: string | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TeamHeatmapCard
        teamName={match.homeTeam.teamName}
        homeOrAway="home"
        players={players}
        error={playersError}
      />
      <TeamHeatmapCard
        teamName={match.awayTeam.teamName}
        homeOrAway="away"
        players={players}
        error={playersError}
      />

      <Card>
        <CardHeader>
          <CardTitle>Passing Network</CardTitle>
          <CardDescription>Node size and edge weight scale with pass volume</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <PassingNetwork />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-cyan-400" />
            3D Pitch Visualizer
          </CardTitle>
          <CardDescription>Rotatable reconstruction of the average shape</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="relative flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded-lg bg-navy-950/60 [perspective:800px]">
            <div className="h-[70%] w-[85%] [transform:rotateX(55deg)]">
              <PitchOutline className="opacity-70" />
            </div>
            <span className="absolute bottom-3 right-3 font-mono text-[10px] uppercase tracking-wider text-slate-500">
              WebGL scene mounts here
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

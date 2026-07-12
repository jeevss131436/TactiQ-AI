"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PassingNetworkFlow } from "@/components/dashboard/PassingNetworkFlow";
import type { RealTeamPassingNetwork } from "@/lib/api";

interface PassingNetworkCardProps {
  teamName: string;
  homeOrAway: "home" | "away";
  networks: RealTeamPassingNetwork[] | null;
  error: string | null;
}

export function PassingNetworkCard({ teamName, homeOrAway, networks, error }: PassingNetworkCardProps) {
  const network = networks?.find((n) => n.homeOrAway === homeOrAway);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passing Network — {teamName}</CardTitle>
        <CardDescription>Node size and edge weight scale with pass volume, from real event data</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {error && (
          <div className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-2 rounded-lg bg-navy-950/60 text-center">
            <p className="text-sm text-signal-down">Could not load real match data</p>
            <p className="max-w-sm text-xs text-slate-500">
              {error} — make sure the backend is running at{" "}
              <code className="font-mono text-slate-400">localhost:8000</code>.
            </p>
          </div>
        )}
        {!error && !networks && (
          <div className="flex aspect-[3/2] w-full items-center justify-center rounded-lg bg-navy-950/60">
            <p className="text-sm text-slate-500">Loading real match data…</p>
          </div>
        )}
        {!error && networks && (
          <PassingNetworkFlow
            nodes={network?.nodes ?? []}
            edges={network?.edges ?? []}
            emptyMessage="No passing data for this team"
          />
        )}
      </CardContent>
    </Card>
  );
}

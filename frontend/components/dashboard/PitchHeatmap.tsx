"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { PitchOutline } from "@/components/dashboard/PitchOutline";

// Plotly touches `window` at import time, so it can only load in the browser.
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Cyan density scale matching the site's single-accent palette, fading from
// transparent (matches the navy background) up to solid cyan-500.
const DENSITY_COLORSCALE: Array<[number, string]> = [
  [0, "rgba(8,15,31,0)"],
  [0.3, "rgba(0,180,216,0.12)"],
  [0.6, "rgba(0,180,216,0.4)"],
  [1, "rgba(0,180,216,0.85)"],
];

// StatsBomb's native pitch dimensions — real touch coordinates arrive in
// these units and get normalized into this component's 0-100 render space.
const STATSBOMB_PITCH_LENGTH = 120;
const STATSBOMB_PITCH_WIDTH = 80;

interface PitchHeatmapProps {
  // Real touch coordinates in StatsBomb's native 120x80 pitch units, straight
  // from event data — one player's touches, or several concatenated for a
  // whole-team view. Plotted directly; nothing here is inferred or synthesized.
  touches: { x: number; y: number }[];
  emptyMessage?: string;
}

export function PitchHeatmap({ touches, emptyMessage }: PitchHeatmapProps) {
  const { x, y } = useMemo(
    () => ({
      x: touches.map((t) => (t.x / STATSBOMB_PITCH_LENGTH) * 100),
      y: touches.map((t) => (t.y / STATSBOMB_PITCH_WIDTH) * 100),
    }),
    [touches]
  );

  if (x.length === 0) {
    return (
      <div className="relative flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded-lg bg-navy-950/60">
        <PitchOutline className="pointer-events-none absolute inset-0 opacity-30" />
        <p className="relative text-sm text-slate-500">
          {emptyMessage ?? "No touch data available"}
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg bg-navy-950/60">
      <PitchOutline className="pointer-events-none absolute inset-0 opacity-50" />
      <Plot
        data={[
          {
            x,
            y,
            type: "histogram2dcontour",
            colorscale: DENSITY_COLORSCALE,
            showscale: false,
            contours: { coloring: "heatmap" },
            line: { width: 0 },
            ncontours: 25,
            hoverinfo: "none",
          },
        ]}
        layout={{
          xaxis: { range: [0, 100], visible: false, fixedrange: true },
          yaxis: { range: [0, 100], visible: false, fixedrange: true, autorange: "reversed" },
          margin: { l: 0, r: 0, t: 0, b: 0 },
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          showlegend: false,
        }}
        config={{ displayModeBar: false, responsive: true, staticPlot: true }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        useResizeHandler
      />
    </div>
  );
}

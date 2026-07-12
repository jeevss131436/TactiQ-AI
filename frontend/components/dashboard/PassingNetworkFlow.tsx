"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PitchOutline } from "@/components/dashboard/PitchOutline";
import type { RealPassingNetworkEdge, RealPassingNetworkNode } from "@/lib/api";

// StatsBomb's native pitch dimensions — node x/y arrive in these units, the
// same space PitchOutline's viewBox is drawn in, so nodes line up with the
// pitch markings behind them with no extra normalization.
const PITCH_LENGTH = 120;
const PITCH_WIDTH = 80;

interface PlayerNodeData extends Record<string, unknown> {
  name: string;
  displayName: string;
  passCount: number;
  size: number;
  showLabel?: boolean;
}

function PlayerNode({ data }: NodeProps<Node<PlayerNodeData>>) {
  const labelText = data.displayName.length > 14 ? `${data.displayName.slice(0, 12)}…` : data.displayName;

  return (
    <div className="relative flex items-center justify-center" title={`${data.name} — ${data.passCount} passes`}>
      <div
        className="flex items-center justify-center rounded-full border border-cyan-300/80 bg-cyan-500/25 font-semibold text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.22)]"
        style={{ width: data.size, height: data.size, fontSize: Math.max(8, data.size / 3.8) }}
      >
        <Handle type="target" id="target" position={Position.Top} isConnectable={false} className="!opacity-0" style={{ inset: 0, width: "100%", height: "100%", transform: "none", border: "none" }} />
        <Handle type="source" id="source" position={Position.Bottom} isConnectable={false} className="!opacity-0" style={{ inset: 0, width: "100%", height: "100%", transform: "none", border: "none" }} />
        {data.passCount}
      </div>
      {data.showLabel ? (
        <div className="absolute top-full mt-1 max-w-[90px] truncate rounded-full border border-slate-700/70 bg-slate-950/80 px-2 py-0.5 text-[9px] font-medium text-slate-100 shadow-sm">
          {labelText}
        </div>
      ) : null}
    </div>
  );
}

const nodeTypes = { player: PlayerNode };

interface PassingNetworkFlowProps {
  nodes: RealPassingNetworkNode[];
  edges: RealPassingNetworkEdge[];
  emptyMessage?: string;
}

export function PassingNetworkFlow({ nodes, edges, emptyMessage }: PassingNetworkFlowProps) {
  const instanceRef = useRef<ReactFlowInstance<Node<PlayerNodeData>, Edge> | null>(null);

  const flowNodes = useMemo<Node<PlayerNodeData>[]>(() => {
    const maxPasses = Math.max(1, ...nodes.map((n) => n.passCount));
    const threshold = Math.max(3, nodes.length <= 10 ? 0 : Math.ceil(nodes.length / 5));
    const topPassers = nodes
      .slice()
      .sort((a, b) => b.passCount - a.passCount)
      .slice(0, threshold)
      .map((n) => n.playerId);

    // Bucket players by rounded positions so tightly-clustered players
    // (exact same or near-identical x/y) can be spread around a small
    // circle to avoid complete overlap in the visualization.
    const buckets: Record<string, typeof nodes> = {};
    const bucketKey = (x: number, y: number) => `${Math.round(x)}:${Math.round(y)}`;
    for (const n of nodes) {
      const key = bucketKey(n.x, n.y);
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(n);
    }

    // Compute adjusted positions: if a bucket has multiple players, spread
    // them radially around the original coordinate. Radius scales with
    // bucket size so larger groups separate more.
    const adjusted: Record<number, { x: number; y: number }> = {};
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    for (const key of Object.keys(buckets)) {
      const group = buckets[key];
      const cx = group[0].x;
      const cy = group[0].y;
      if (group.length === 1) {
        adjusted[group[0].playerId] = { x: cx, y: cy };
        continue;
      }

      const groupSize = group.length;
      // base radius in pitch units; tune for visibility but keep small
      const base = 1.8;
      const radius = base + Math.min(8, groupSize) * 1.2;

      for (let i = 0; i < group.length; i++) {
        const angle = (i / group.length) * Math.PI * 2;
        const nx = cx + Math.cos(angle) * radius;
        const ny = cy + Math.sin(angle) * radius;
        // keep inside pitch bounds with small margin
        adjusted[group[i].playerId] = {
          x: clamp(nx, 1, PITCH_LENGTH - 1),
          y: clamp(ny, 1, PITCH_WIDTH - 1),
        };
      }
    }
    // Add a tiny deterministic jitter to break perfect overlaps, then
    // run a stronger relaxation loop to push very-close nodes apart
    // while keeping them generally near their computed positions. This
    // is more aggressive than before to handle severe central clustering.
    const positions: Record<number, { x: number; y: number }> = { ...adjusted };
    const deterministic = (id: number) => {
      // simple LCG-like deterministic pseudo-random using id
      const a = (id * 9301 + 49297) % 233280;
      return a / 233280;
    };
    // ensure every player has an entry
    for (const n of nodes) positions[n.playerId] = positions[n.playerId] ?? { x: n.x, y: n.y };

    const orig: Record<number, { x: number; y: number }> = {};
    for (const n of nodes) orig[n.playerId] = { x: n.x, y: n.y };

    // break symmetry with small jitter (pitch units)
    const jitterAmount = 1.6;
    for (const n of nodes) {
      const r = deterministic(n.playerId);
      positions[n.playerId] = positions[n.playerId] ?? { x: n.x, y: n.y };
      positions[n.playerId].x += (r - 0.5) * jitterAmount;
      positions[n.playerId].y += (deterministic(n.playerId + 7) - 0.5) * jitterAmount;
    }

    // stronger relaxation iterations
    const iter = 400;
    for (let k = 0; k < iter; k++) {
      const moves: Record<number, { dx: number; dy: number }> = {};
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        moves[a.playerId] = { dx: 0, dy: 0 };
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const A = nodes[i];
          const B = nodes[j];
          const pa = positions[A.playerId];
          const pb = positions[B.playerId];
          let dx = pa.x - pb.x;
          let dy = pa.y - pb.y;
          let dist = Math.hypot(dx, dy) || 0.0001;

          // desired minimum distance between these two nodes (pitch units)
          const sizeA = 8 + (A.passCount / Math.max(1, maxPasses)) * 12;
          const sizeB = 8 + (B.passCount / Math.max(1, maxPasses)) * 12;
          const desired = 1.6 + (sizeA + sizeB) * 0.06; // tuned constant

          if (dist < desired) {
            const overlap = (desired - dist) / dist;
            // more aggressive push
            const shiftX = dx * overlap * 0.9;
            const shiftY = dy * overlap * 0.9;
            moves[A.playerId].dx += shiftX;
            moves[A.playerId].dy += shiftY;
            moves[B.playerId].dx -= shiftX;
            moves[B.playerId].dy -= shiftY;
          }
        }
      }

      // apply moves with a damping factor and pull back slightly to origin
      for (const n of nodes) {
        const m = moves[n.playerId];
        if (!m) continue;
        const pos = positions[n.playerId];
        // lighter pull toward original to allow spreading
        const pull = 0.02;
        pos.x += m.dx * 0.7 - (pos.x - orig[n.playerId].x) * pull;
        pos.y += m.dy * 0.7 - (pos.y - orig[n.playerId].y) * pull;
        // clamp inside pitch
        pos.x = clamp(pos.x, 1, PITCH_LENGTH - 1);
        pos.y = clamp(pos.y, 1, PITCH_WIDTH - 1);
      }
    }

    return nodes.map((n) => ({
      id: String(n.playerId),
      type: "player",
      position: adjusted[n.playerId] ?? { x: n.x, y: n.y },
      data: {
        name: n.name,
        displayName: n.name,
        passCount: n.passCount,
        size: 8 + (n.passCount / maxPasses) * 12,
        showLabel: topPassers.includes(n.playerId),
      },
      draggable: false,
      selectable: false,
    }));
  }, [nodes]);

  const flowEdges = useMemo<Edge[]>(() => {
    const maxCount = Math.max(1, ...edges.map((e) => e.count));
    return edges.map((e) => ({
      id: `${e.fromPlayerId}-${e.toPlayerId}`,
      source: String(e.fromPlayerId),
      target: String(e.toPlayerId),
      sourceHandle: "source",
      targetHandle: "target",
      type: "straight",
      selectable: false,
      style: {
        stroke: "rgba(34,211,238,0.75)",
        strokeWidth: 0.8 + (e.count / maxCount) * 2.6,
        strokeLinecap: "round",
      },
      markerEnd: { type: MarkerType.ArrowClosed, width: 7, height: 7, color: "rgba(34,211,238,0.85)" },
    }));
  }, [edges]);

  // The pitch is a fixed 120x80 space; fitting the viewport to those exact
  // bounds (rather than the auto-computed node bounding box) keeps nodes
  // aligned with the PitchOutline markings behind them regardless of which
  // part of the pitch a team's passes cluster in.
  const fitToPitch = () => {
    instanceRef.current?.fitBounds({ x: 0, y: 0, width: PITCH_LENGTH, height: PITCH_WIDTH }, { padding: 10 });
  };

  useEffect(() => {
    fitToPitch();
    window.addEventListener("resize", fitToPitch);
    return () => window.removeEventListener("resize", fitToPitch);
  }, [flowNodes, flowEdges]);

  if (nodes.length === 0) {
    return (
      <div className="relative flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded-lg bg-navy-950/60">
        <PitchOutline className="pointer-events-none absolute inset-0 opacity-30" />
        <p className="relative text-sm text-slate-500">{emptyMessage ?? "No passing data available"}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg border border-slate-800/80 bg-navy-950/70 shadow-inner">
      <PitchOutline className="pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-2 rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-3 text-slate-200 shadow-lg">
        <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-slate-950/90 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-200">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
          Larger node = more passes
        </div>
        <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-slate-950/90 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-100/30" />
          Thicker edge = more links
        </div>
      </div>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onInit={(instance) => {
          instanceRef.current = instance;
          fitToPitch();
        }}
        minZoom={0.1}
        maxZoom={50}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
        className="!bg-transparent"
      />
    </div>
  );
}

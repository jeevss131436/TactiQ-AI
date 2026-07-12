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
  passCount: number;
  size: number;
}

function PlayerNode({ data }: NodeProps<Node<PlayerNodeData>>) {
  return (
    <div
      className="flex items-center justify-center rounded-full border border-cyan-400/60 bg-cyan-500/20 font-mono text-cyan-100"
      style={{ width: data.size, height: data.size, fontSize: data.size / 4.2 }}
      title={`${data.name} — ${data.passCount} passes`}
    >
      <Handle type="target" id="target" position={Position.Top} isConnectable={false} className="!opacity-0" style={{ inset: 0, width: "100%", height: "100%", transform: "none", border: "none" }} />
      <Handle type="source" id="source" position={Position.Bottom} isConnectable={false} className="!opacity-0" style={{ inset: 0, width: "100%", height: "100%", transform: "none", border: "none" }} />
      {data.passCount}
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
    return nodes.map((n) => ({
      id: String(n.playerId),
      type: "player",
      position: { x: n.x, y: n.y },
      data: { name: n.name, passCount: n.passCount, size: 6 + (n.passCount / maxPasses) * 8 },
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
        stroke: "rgba(0,180,216,0.45)",
        strokeWidth: 0.4 + (e.count / maxCount) * 2.2,
      },
      markerEnd: { type: MarkerType.ArrowClosed, width: 6, height: 6, color: "rgba(0,180,216,0.6)" },
    }));
  }, [edges]);

  // The pitch is a fixed 120x80 space; fitting the viewport to those exact
  // bounds (rather than the auto-computed node bounding box) keeps nodes
  // aligned with the PitchOutline markings behind them regardless of which
  // part of the pitch a team's passes cluster in.
  const fitToPitch = () => {
    instanceRef.current?.fitBounds({ x: 0, y: 0, width: PITCH_LENGTH, height: PITCH_WIDTH }, { padding: 0 });
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
    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg bg-navy-950/60">
      <PitchOutline className="pointer-events-none absolute inset-0 opacity-50" />
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

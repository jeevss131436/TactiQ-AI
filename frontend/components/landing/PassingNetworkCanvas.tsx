"use client";

import { useEffect, useRef } from "react";

// The signature hero visual: a constellation of nodes and connecting arcs
// modeled on a real passing network, the same graphic the dashboard
// renders from match data. Here it drifts slowly and redraws its edges
// to suggest a live analysis running in the background.
export function PassingNetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const nodeCount = 11;
    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00025,
      vy: (Math.random() - 0.5) * 0.00025,
      r: 2.5 + Math.random() * 2.5,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    const edges: [number, number][] = [];
    for (let i = 0; i < nodeCount; i++) {
      const connections = 2 + Math.floor(Math.random() * 2);
      for (let c = 0; c < connections; c++) {
        const j = Math.floor(Math.random() * nodeCount);
        if (j !== i) edges.push([i, j]);
      }
    }

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let t = 0;

    function frame() {
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      t += prefersReducedMotion ? 0 : 0.016;

      for (const n of nodes) {
        if (!prefersReducedMotion) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0.05 || n.x > 0.95) n.vx *= -1;
          if (n.y < 0.05 || n.y > 0.95) n.vy *= -1;
        }
      }

      ctx.lineWidth = 1;
      edges.forEach(([a, b], i) => {
        const na = nodes[a];
        const nb = nodes[b];
        const flicker = 0.15 + 0.15 * Math.sin(t * 0.6 + i);
        ctx.strokeStyle = `rgba(0, 180, 216, ${Math.max(0.05, flicker)})`;
        ctx.beginPath();
        ctx.moveTo(na.x * width, na.y * height);
        ctx.lineTo(nb.x * width, nb.y * height);
        ctx.stroke();
      });

      nodes.forEach((n) => {
        const pulse = 0.6 + 0.4 * Math.sin(t * 1.2 + n.pulsePhase);
        ctx.beginPath();
        ctx.arc(n.x * width, n.y * height, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(78, 168, 222, ${0.5 + 0.3 * pulse})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x * width, n.y * height, n.r + 5 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 180, 216, ${0.15 * pulse})`;
        ctx.stroke();
      });

      raf = requestAnimationFrame(frame);
    }

    frame();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full opacity-80"
    />
  );
}

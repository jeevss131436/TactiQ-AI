"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PassingNetworkCanvas } from "./PassingNetworkCanvas";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-navy-700/60 bg-navy-950">
      <div className="absolute inset-0 bg-hero-glow" />
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      <PassingNetworkCanvas />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 py-32 text-center sm:py-40">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-cyan-300"
        >
          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-cyan-400" />
          Built on StatsBomb Open Data
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-balance font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl"
        >
          Analyst-Grade Tactical AI
          <br />
          <span className="text-cyan-400">Over Real Match Data</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl text-balance text-lg text-slate-400"
        >
          TactiqAI reads event-level match data the way a scout does, then explains
          what happened: structured strengths and weaknesses, the moments that
          turned the game, and every player's role in it.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <Button asChild size="lg">
            <Link href="/matches">
              Explore matches
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">
              <PlayCircle className="h-4 w-4" />
              Launch Dashboard
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const coverage = [
  { label: "Matches, fully searchable", detail: "Every game in the StatsBomb Open Data clone — search by team, competition, or season", stat: "3,900+" },
  { label: "Competitions", detail: "World Cups, Champions League, top domestic leagues, and women's football, men's and women's", stat: "24" },
  { label: "Event-level detail", detail: "Coordinates, xG, passes, shots, pressures and player positions behind every visualization", stat: "Per-event" },
];

export function DataCoverage() {
  return (
    <section id="data" className="bg-navy-950 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"
        >
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">
              Data coverage
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Grounded in StatsBomb Open Data
            </h2>
          </div>
          <p className="max-w-sm text-sm text-slate-400">
            Every report is generated from real, event-level match data, free
            for research and non-commercial use.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8"
        >
          <Button asChild size="lg">
            <Link href="/matches">
              Search matches
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-navy-700 bg-navy-700 sm:grid-cols-3">
          {coverage.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-navy-900 p-8"
            >
              <p className="font-mono text-3xl font-semibold text-cyan-400">{item.stat}</p>
              <p className="mt-2 font-display text-base font-medium text-white">{item.label}</p>
              <p className="mt-2 text-sm text-slate-400">{item.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

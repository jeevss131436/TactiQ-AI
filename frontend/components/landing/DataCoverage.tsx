"use client";

import { motion } from "framer-motion";

const coverage = [
  { label: "FIFA World Cups", detail: "Every tournament StatsBomb has published, 1970 to 2022", stat: "13" },
  { label: "Champions League Finals", detail: "Full event data for Europe's showcase match", stat: "9" },
  { label: "Messi's La Liga career", detail: "Season-by-season event data across his time at Barcelona", stat: "17 seasons" },
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

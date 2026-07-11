"use client";

import { motion } from "framer-motion";
import { Brain, Radar, UserSquare2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "Structured AI Tactical Analysis",
    description:
      "Every match distilled into strengths, weaknesses, and the turning points that decided it, written the way an analyst would brief a coaching staff.",
  },
  {
    icon: Radar,
    title: "Interactive Data Visualizations",
    description:
      "Team heatmaps, passing networks, and a 3D pitch scene reconstruct the shape of a match, not just the scoreline.",
  },
  {
    icon: UserSquare2,
    title: "Player Performance Profiles",
    description:
      "Per-player stat lines, average positioning, and involvement, built from the same event stream that powers the team analysis.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="border-b border-navy-700/60 bg-navy-950 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">
            Core capabilities
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            One match, read three ways
          </h2>
          <p className="mt-4 text-slate-400">
            Reasoning, visuals, and player-level data drawn from the same underlying
            event data, so every view of a match agrees with the others.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <Card className="group h-full transition-colors hover:border-cyan-500/40 hover:shadow-glow-sm">
                <CardContent className="flex h-full flex-col gap-4 p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 transition-colors group-hover:bg-cyan-500/20">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="text-[0.95rem] leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

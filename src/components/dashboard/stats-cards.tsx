"use client";

import { motion } from "framer-motion";
import { Target, Swords } from "lucide-react";

export function StatsCards({
  targetScore,
  sessionsCount,
}: {
  targetScore: number | null;
  sessionsCount: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <motion.div 
        whileHover={{ scale: 1.05, y: -2 }}
        className="group relative overflow-hidden rounded-xl border border-athena-amber/20 bg-card/40 p-4 backdrop-blur-md transition-all hover:border-athena-amber/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)] flex flex-col justify-center items-center"
      >
        <div className="absolute -left-4 -top-4 h-16 w-16 rounded-full bg-blue-500/10 blur-xl transition-all group-hover:bg-blue-500/20" />
        <Target className="h-6 w-6 text-blue-400 mb-2 opacity-80" />
        <p className="text-3xl font-black tracking-tight text-foreground drop-shadow-md">
          {targetScore ?? "\u2014"}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400/80 mt-1">
          Target
        </p>
      </motion.div>
      <motion.div 
        whileHover={{ scale: 1.05, y: -2 }}
        className="group relative overflow-hidden rounded-xl border border-athena-amber/20 bg-card/40 p-4 backdrop-blur-md transition-all hover:border-athena-amber/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)] flex flex-col justify-center items-center"
      >
        <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-emerald-500/10 blur-xl transition-all group-hover:bg-emerald-500/20" />
        <Swords className="h-6 w-6 text-emerald-400 mb-2 opacity-80" />
        <p className="text-3xl font-black tracking-tight text-foreground drop-shadow-md">
          {sessionsCount}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80 mt-1">
          Sessions
        </p>
      </motion.div>
    </div>
  );
}

"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowRight, Diamond, Trophy, Sparkles, Shield, Star } from "lucide-react";
import Link from "next/link";
import { getRankProgress, RANKS } from "@/lib/ranks";
import { cn } from "@/lib/utils";

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariant: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

export function RankCard({
  totalScore,
  weeklyDelta,
}: {
  totalScore: number;
  weeklyDelta: number;
}) {
  const { current, next, pct, pointsToNext } = getRankProgress(totalScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-athena-amber/20 bg-card/40 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] group"
    >
      {/* Background dynamic glow */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-athena-amber/10 blur-3xl transition-all duration-700 group-hover:bg-athena-amber/20 pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      {/* Top section: Current Rank & Action */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-athena-amber/30 bg-gradient-to-br from-athena-amber/20 to-primary/10 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
          >
            <span className="text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{current.emoji}</span>
            <div className="absolute -right-1 -top-1">
              <Sparkles className="h-4 w-4 text-athena-amber fill-athena-amber animate-pulse" />
            </div>
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-athena-amber drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                {current.name}
              </h2>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Level {Math.floor(totalScore / 1000) + 1}</span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground/80">
              Wielding: <span className="italic text-foreground">{current.weapon}</span>
            </p>
          </div>
        </div>

        <Link href="/profile" className="group/link">
          <motion.div
            whileHover={{ x: 3 }}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:border-athena-amber/30 hover:text-athena-amber"
          >
            View Journey <ArrowRight className="h-3 w-3" />
          </motion.div>
        </Link>
      </div>

      {/* Score area */}
      <div className="relative z-10 mt-8 flex items-end gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Current XP</span>
          <span className="text-5xl font-black tracking-tighter text-foreground tabular-nums drop-shadow-sm">
            {totalScore.toLocaleString()}
          </span>
        </div>
        {weeklyDelta > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-1.5 flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
          >
            <Diamond className="h-3 w-3 fill-emerald-500 text-emerald-500" />
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">+{weeklyDelta}</span>
          </motion.div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 mt-8">
        <div className="mb-2.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-2 text-muted-foreground">
             <Shield className="h-3 w-3" />
             <span>{current.name}</span>
          </div>
          {next && (
            <div className="flex items-center gap-2 text-athena-amber">
              <span>{next.name}</span>
              <Trophy className="h-3 w-3" />
            </div>
          )}
        </div>

        <div className="relative h-3 w-full overflow-hidden rounded-full bg-black/20 dark:bg-white/5 border border-white/5 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            className="relative h-full rounded-full bg-gradient-to-r from-athena-amber via-amber-400 to-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.4)]"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" style={{ backgroundSize: "200% 100%" }} />
          </motion.div>
        </div>

        {next ? (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[10px] font-medium text-muted-foreground">
              <span className="font-bold text-athena-amber">{pointsToNext.toLocaleString()} XP</span> to reach <span className="text-foreground">{next.name}</span>
            </p>
            <span className="text-[10px] font-black text-athena-amber">{Math.round(pct)}%</span>
          </div>
        ) : (
          <p className="mt-3 text-center text-[10px] font-black uppercase tracking-widest text-athena-amber">
            Max Rank Achieved!
          </p>
        )}
      </div>

      {/* Mini Roadmap / Weapon Rack */}
      <div className="relative z-10 mt-8 flex items-center justify-between border-t border-white/5 pt-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="flex w-full items-center justify-between gap-1"
        >
          {RANKS.slice(0, 6).map((rank, idx) => {
            const isUnlocked = totalScore >= rank.threshold;
            const isCurrent = current.name === rank.name;

            return (
              <div key={rank.name} className="relative flex flex-col items-center gap-2 flex-1">
                <motion.div
                  variants={itemVariant}
                  whileHover={{ scale: 1.2, y: -4 }}
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300",
                    isUnlocked
                      ? "border-athena-amber/40 bg-athena-amber/10 text-athena-amber shadow-[0_0_10px_rgba(251,191,36,0.15)]"
                      : "border-white/5 bg-white/5 text-muted-foreground/30 grayscale opacity-40",
                    isCurrent && "ring-2 ring-athena-amber ring-offset-4 ring-offset-background"
                  )}
                  title={`${rank.name}: ${rank.weapon}`}
                >
                  <span className="text-lg">{rank.emoji}</span>
                  {isCurrent && (
                    <motion.div
                      layoutId="current-rank-indicator"
                      className="absolute -bottom-1 h-1 w-1 rounded-full bg-athena-amber"
                    />
                  )}
                </motion.div>
                
                {/* Connecting line */}
                {idx < 5 && (
                  <div className="absolute left-[calc(50%+1.25rem)] top-5 h-[1px] w-[calc(100%-2.5rem)] bg-white/5">
                    <div
                      className={cn(
                        "h-full transition-all duration-1000",
                        totalScore >= RANKS[idx + 1].threshold ? "bg-athena-amber/40" : "bg-transparent"
                      )}
                      style={{ width: totalScore >= RANKS[idx + 1].threshold ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}

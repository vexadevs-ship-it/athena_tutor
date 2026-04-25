"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Zap, Clock, Target, ArrowRight } from "lucide-react";
import { useQuestContext } from "./quest-context";
import { cn } from "@/lib/utils";

export function QuestResultsScreen() {
  const router = useRouter();
  const ctx = useQuestContext();

  const accuracy = ctx.problems.length > 0
    ? Math.round((ctx.score / ctx.problems.length) * 100)
    : 0;

  const minutes = Math.floor(ctx.elapsed / 60);
  const seconds = ctx.elapsed % 60;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-12">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.8, bounce: 0.3 }}
        className="relative z-10 w-full max-w-lg space-y-10"
      >
        {/* Victory Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ rotate: -15, scale: 0.5 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-athena-amber/20 to-primary/20 border border-athena-amber/30 shadow-[0_0_50px_rgba(251,191,36,0.3)] ring-1 ring-athena-amber/50"
          >
            <Trophy className="h-12 w-12 text-athena-amber drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
          </motion.div>
          
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter uppercase text-foreground drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              Quest Complete
            </h1>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-athena-amber">
              {accuracy >= 80 ? "Ascended Master" : accuracy >= 60 ? "Battle Hardened" : "Survivalist"}
            </p>
          </div>
          
          <p className="max-w-xs mx-auto text-sm text-muted-foreground font-medium italic">
            &ldquo;{accuracy >= 80 
              ? "You have conquered the arena with unmatched precision." 
              : accuracy >= 60 
                ? "A formidable effort. Your skills are sharpening." 
                : "The path to mastery is paved with lessons learned in battle."}&rdquo;
          </p>
        </div>

        {/* Stats Glass Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 text-center transition-all hover:border-primary/50 hover:bg-card/60">
            <Target className="mx-auto mb-3 h-6 w-6 text-primary transition-transform group-hover:scale-110" />
            <p className="text-3xl font-black text-foreground">{ctx.score}<span className="text-lg text-muted-foreground/50">/{ctx.problems.length}</span></p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">Conquered</p>
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 text-center transition-all hover:border-athena-amber/50 hover:bg-card/60">
            <div className="mx-auto mb-3 text-xl font-black text-athena-amber transition-transform group-hover:scale-110">{accuracy}%</div>
            <p className="text-lg font-black text-foreground uppercase tracking-widest">Accuracy</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">Efficiency</p>
            <div className="absolute inset-0 bg-athena-amber/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 text-center transition-all hover:border-white/20 hover:bg-card/60">
            <Clock className="mx-auto mb-3 h-6 w-6 text-muted-foreground transition-transform group-hover:scale-110" />
            <p className="text-3xl font-black text-foreground">{minutes}:{seconds.toString().padStart(2, "0")}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">Time Elapsed</p>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 text-center transition-all hover:border-athena-amber/50 hover:bg-card/60 shadow-[0_0_30px_rgba(251,191,36,0.1)]">
            <Zap className="mx-auto mb-3 h-6 w-6 text-athena-amber animate-pulse" />
            <p className="text-3xl font-black text-athena-amber">+{ctx.xpEarned}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-athena-amber/60 mt-1">XP Forged</p>
            <div className="absolute inset-0 bg-athena-amber/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Focus breakdown */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
             <div className="h-px flex-1 bg-white/5" />
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Tactical Breakdown</h3>
             <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="space-y-2">
            {(["weak", "mid", "stretch"] as const).map((bucket) => {
              const bucketProblems = ctx.problems.filter((p) => p.bucket === bucket);
              if (bucketProblems.length === 0) return null;
              const correct = bucketProblems.filter((p) => p.isCorrect).length;
              const label =
                bucket === "weak" ? "Weak Areas" : bucket === "mid" ? "Mid Level" : "Stretch";
              const pct = (correct / bucketProblems.length) * 100;
              
              return (
                <div key={bucket} className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 px-4 py-3 flex items-center justify-between">
                  <div className="flex flex-col">
                     <span className="text-xs font-black uppercase tracking-wide text-foreground">{label}</span>
                     <span className="text-[9px] font-medium text-muted-foreground">{bucketProblems.length} Encounters</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-1.5 w-24 rounded-full bg-black/40 overflow-hidden border border-white/5">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${pct}%` }}
                         className={cn(
                           "h-full rounded-full",
                           pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500"
                         )}
                       />
                    </div>
                    <span className="text-sm font-black text-foreground">
                      {correct}/{bucketProblems.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(var(--primary), 0.3)" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/dashboard")}
          className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-primary px-6 py-4 font-black uppercase tracking-widest text-primary-foreground shadow-xl transition-all"
        >
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite]" />
          <span>Return to Sanctum</span>
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </motion.button>
      </motion.div>
    </div>
  );
}

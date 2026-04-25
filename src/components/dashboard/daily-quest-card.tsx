"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Swords, Sparkles, CheckCircle2, Zap, Trophy, Shield, ArrowRight } from "lucide-react";
import { useTodaysQuest } from "@/hooks/use-daily-quest";
import { cn } from "@/lib/utils";

const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export function DailyQuestCard() {
  const { data, isLoading } = useTodaysQuest();

  if (isLoading) {
    return <div className="h-48 glass-panel animate-pulse rounded-3xl border border-white/10" />;
  }

  const quest = data?.quest;

  // Quest still loading/generating
  if (!quest) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-dashed border-muted-foreground/20 bg-card/40 px-6 py-10 text-center backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <Swords className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
        </motion.div>
        <p className="text-xl font-black text-foreground uppercase tracking-widest">
          Forging Your Quest...
        </p>
        <p className="mt-2 text-sm font-medium text-muted-foreground max-w-[240px] mx-auto leading-relaxed">
          The masters are crafting a custom challenge tailored to your skill.
        </p>
      </div>
    );
  }

  // Quest completed
  if (quest.status === "completed") {
    const accuracy = quest.totalQuestions > 0
      ? Math.round((quest.correctCount / quest.totalQuestions) * 100)
      : 0;

    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="group relative overflow-hidden rounded-3xl p-[2px] shadow-[0_12px_40px_-12px_rgba(34,197,94,0.3)] transition-all duration-500 hover:shadow-[0_15px_50px_-10px_rgba(34,197,94,0.4)]"
      >
        {/* Legendary victory border */}
        <div
          className="pointer-events-none absolute inset-0 animate-[border-rotate_3s_linear_infinite] opacity-60 group-hover:opacity-100 transition-opacity"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(34,197,94,0.1), rgba(34,197,94,0.8), rgba(74,222,128,1), rgba(34,197,94,0.8), rgba(34,197,94,0.1))",
          }}
        />
        
        <div className="relative h-full overflow-hidden bg-card/95 backdrop-blur-2xl px-6 py-8 rounded-[22px] flex flex-col items-center text-center">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />
          
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/15 border border-green-500/30"
          >
             <CheckCircle2 className="h-9 w-9 text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
             <div className="absolute -top-2 -right-2">
                <Trophy className="h-5 w-5 text-athena-amber fill-athena-amber drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
             </div>
          </motion.div>

          <h3 className="text-2xl font-black tracking-tight text-foreground uppercase">Quest Victorious!</h3>
          <p className="mt-1 text-sm font-bold text-muted-foreground">
             <span className="text-green-500">{quest.correctCount} enemies vanquished</span> with {accuracy}% focus
          </p>

          <div className="mt-6 flex w-full items-center justify-between border-t border-border/40 pt-5">
             <div className="flex flex-col items-start">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mastery</span>
               <span className="text-sm font-bold text-foreground">Flawless Run</span>
             </div>
             <div className="flex flex-col items-end">
               <span className="text-[10px] font-black uppercase tracking-widest text-athena-amber">Reward</span>
               <div className="flex items-center gap-1.5 text-athena-amber">
                 <Zap className="h-5 w-5 fill-athena-amber drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                 <span className="text-xl font-black">+{quest.xpEarned} XP</span>
               </div>
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Quest ready or in progress
  const answered = data?.problems?.filter(
    (p: { isCorrect: boolean | null }) => p.isCorrect !== null
  ).length ?? 0;
  const progress = Math.round((answered / quest.totalQuestions) * 100);

  return (
    <Link href="/quest" className="block group">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="relative overflow-hidden rounded-3xl p-[2px] transition-all duration-300"
      >
        {/* Animated active quest border */}
        <div
          className="pointer-events-none absolute inset-0 animate-[border-rotate_4s_linear_infinite] opacity-30 group-hover:opacity-70 transition-opacity duration-300"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(251,191,36,0.1), rgba(251,191,36,0.5), rgba(251,191,36,0.8), rgba(251,191,36,0.5), rgba(251,191,36,0.1))",
          }}
        />

        <div className="relative h-full bg-card/80 backdrop-blur-2xl px-6 py-8 rounded-[22px] flex flex-col items-center text-center border border-white/5 transition-shadow group-hover:shadow-[0_15px_40px_rgba(251,191,36,0.1)]">
          <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-athena-amber/5 blur-3xl pointer-events-none" />

          <motion.div 
            animate={{ y: [0, -5, 0] }} 
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="relative mb-5"
          >
            <div className="absolute -right-2 -top-2">
              <Sparkles className="h-6 w-6 text-athena-amber animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            </div>
            <div className="h-16 w-16 rounded-2xl bg-athena-amber/15 flex items-center justify-center border border-athena-amber/30 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
              <Swords className="h-8 w-8 text-athena-amber drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
            </div>
          </motion.div>

          <h3 className="text-2xl font-black tracking-tight text-foreground uppercase group-hover:text-athena-amber transition-colors">Daily Quest</h3>
          <p className="mt-1.5 text-sm font-bold text-muted-foreground">
            {answered > 0
              ? `${answered} of ${quest.totalQuestions} challenges conquered`
              : `${quest.totalQuestions} legendary foes await`}
          </p>

          {/* Progress Section */}
          <div className="mt-6 w-full space-y-2">
            <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
               <span>Progress</span>
               <span>{progress}%</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-black/20 dark:bg-white/5 border border-white/5 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative h-full rounded-full bg-gradient-to-r from-athena-amber-light via-athena-amber to-amber-600 shadow-[0_0_10px_rgba(251,191,36,0.4)]"
              >
                 <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" style={{ backgroundSize: "200% 100%" }} />
              </motion.div>
            </div>
          </div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="mt-8 flex items-center gap-2 rounded-xl bg-athena-amber/10 border border-athena-amber/30 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-athena-amber group-hover:bg-athena-amber group-hover:text-white transition-all duration-300 shadow-[0_4px_15px_rgba(251,191,36,0.1)] group-hover:shadow-[0_6px_20px_rgba(251,191,36,0.3)]"
          >
            {answered > 0 ? "Continue Quest" : "Begin Adventure"}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useFullSatStatus, useStartFullSat, useFullSatHistory } from "@/hooks/use-full-sat";
import { motion, type Variants } from "framer-motion";
import { Clock, Trophy, Lock, ArrowRight, ChevronLeft, Shield, Swords, Sparkles, Star } from "lucide-react";

function formatDaysUntil(dateString: string): string {
  const diff = new Date(dateString).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Available now";
  if (days === 1) return "1 day";
  return `${days} days`;
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function FullSatLandingPage() {
  const router = useRouter();
  const { data: status, isLoading } = useFullSatStatus();
  const { data: history } = useFullSatHistory();
  const startMutation = useStartFullSat();

  if (isLoading || !status) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]" />
          <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading arena…</p>
        </div>
      </div>
    );
  }

  const handleStart = async (testId: string) => {
    const result = await startMutation.mutateAsync({ testId });
    router.push(`/full-sat/${result.attemptId}`);
  };

  const handleResume = () => {
    if (status.currentAttempt) {
      router.push(`/full-sat/${status.currentAttempt.id}`);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8">

        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/dashboard")}
          className="mb-8 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Dashboard
        </motion.button>

        {/* Hero */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mb-10"
        >
          <motion.div variants={item} className="flex items-start gap-5 mb-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 shadow-[0_0_25px_rgba(59,130,246,0.2)]">
              <Shield className="h-8 w-8 text-blue-500 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              <div className="absolute -right-1 -top-1">
                <Sparkles className="h-4 w-4 text-athena-amber fill-athena-amber drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">
                Full SAT Gauntlet
              </h1>
              <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed max-w-lg">
                Enter the ultimate arena — 98 questions across Reading &amp; Writing and Math.
                Timed sections. Real SAT scoring <span className="font-bold text-foreground">400–1600</span>.
              </p>
            </div>
          </motion.div>

          {/* Meta pills */}
          <motion.div variants={item} className="flex flex-wrap gap-2 ml-21">
            {[
              { icon: Clock, label: "134 minutes" },
              { icon: Star, label: "98 questions" },
              { icon: Trophy, label: "400–1600 score" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm px-3 py-1 text-xs font-medium text-foreground/80">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                {label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Cooldown notice */}
        {!status.canTakeTest && status.nextAvailableDate && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-4 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 px-5 py-4 backdrop-blur-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/30">
              <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Cooldown Active</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Next test available in{" "}
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {formatDaysUntil(status.nextAvailableDate)}
                </span>
              </p>
            </div>
          </motion.div>
        )}

        {/* Resume in-progress */}
        {status.currentAttempt && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleResume}
              className="group w-full relative overflow-hidden rounded-2xl border-2 border-primary/50 bg-card/70 backdrop-blur-sm px-6 py-5 text-left transition-all hover:border-primary hover:shadow-[0_0_25px_rgba(var(--primary),0.2)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/30">
                    <Swords className="h-5 w-5 text-primary drop-shadow-[0_0_6px_rgba(var(--primary),0.6)]" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Resume Battle</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Started {new Date(status.currentAttempt.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* Available tests */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <motion.h2 variants={item} className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            ✦ Available Tests
          </motion.h2>

          {status.tests.length === 0 ? (
            <motion.div variants={item} className="rounded-2xl border border-dashed border-border/60 bg-card/30 py-12 text-center">
              <Shield className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No tests available yet. The arena is being prepared.</p>
            </motion.div>
          ) : (
            status.tests.map((test) => (
              <motion.div
                key={test.id}
                variants={item}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 transition-all hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.12)] hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-foreground">{test.name}</h3>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        134 min
                      </span>
                      <span className="text-border">·</span>
                      <span>98 questions</span>
                      <span className="text-border">·</span>
                      <span>R&amp;W + Math</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleStart(test.id)}
                    disabled={!status.canTakeTest || !!status.currentAttempt || startMutation.isPending}
                    className="shrink-0 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {startMutation.isPending ? "Starting…" : "Enter Arena"}
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Past attempts */}
        {history?.attempts && history.attempts.filter((a) => a.status === "completed").length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 space-y-3"
          >
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              ✦ Battle History
            </h2>

            {history.attempts
              .filter((a) => a.status === "completed")
              .map((attempt, i) => (
                <motion.div
                  key={attempt.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 flex items-center justify-between transition-all hover:border-amber-500/30 hover:bg-amber-500/3"
                >
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {new Date(attempt.completedAt!).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>R&amp;W: <span className="font-bold text-blue-600 dark:text-blue-400">{attempt.rwScaledScore}</span></span>
                      <span>Math: <span className="font-bold text-purple-600 dark:text-purple-400">{attempt.mathScaledScore}</span></span>
                      <span>Time: {Math.round(attempt.totalTimeSeconds / 60)}m</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                      {attempt.totalScore}
                    </span>
                  </div>
                </motion.div>
              ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

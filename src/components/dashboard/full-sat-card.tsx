"use client";

import Link from "next/link";
import { useFullSatStatus } from "@/hooks/use-full-sat";
import { FileText, Lock, ArrowRight, Trophy, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

function formatDaysUntil(dateString: string): string {
  const diff = new Date(dateString).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "now";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export function FullSatCard() {
  const { data: status, isLoading } = useFullSatStatus();

  if (isLoading || !status) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-md">
        <div className="h-5 w-32 bg-muted/50 animate-pulse rounded" />
        <div className="mt-3 h-4 w-48 bg-muted/50 animate-pulse rounded" />
      </div>
    );
  }

  // In-progress attempt
  if (status.currentAttempt) {
    return (
      <Link href={`/full-sat/${status.currentAttempt.id}`} className="block group">
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="relative overflow-hidden rounded-xl border border-primary/50 bg-card/60 p-5 backdrop-blur-md transition-all hover:border-primary hover:shadow-[0_0_25px_rgba(var(--primary),0.2)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 group-hover:opacity-100 transition-all" />
          
          <div className="relative flex items-center gap-4 z-10">
            <div className="relative rounded-xl bg-primary/20 p-3 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
              <FileText className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)] animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-foreground drop-shadow-sm">Full SAT Trial</p>
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/30">
                  Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Return to the arena to finish your test
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-primary shrink-0 transition-transform group-hover:translate-x-1" />
          </div>
        </motion.div>
      </Link>
    );
  }

  // Last score + cooldown
  if (status.lastAttempt) {
    return (
      <Link href="/full-sat" className={`block group ${!status.canTakeTest ? 'pointer-events-none opacity-80' : ''}`}>
        <motion.div 
          whileHover={status.canTakeTest ? { scale: 1.02, y: -2 } : {}}
          className={`relative overflow-hidden rounded-xl border ${status.canTakeTest ? 'border-amber-500/30 bg-card/60 hover:border-amber-500/80 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-border/50 bg-card/40'} p-5 backdrop-blur-md transition-all`}
        >
          {status.canTakeTest && <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent pointer-events-none" />}
          
          <div className="relative flex items-center gap-4 z-10">
            <div className={`relative rounded-xl p-3 ${status.canTakeTest ? 'bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-muted'}`}>
              <Trophy className={`h-6 w-6 ${status.canTakeTest ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-foreground drop-shadow-sm">Full SAT Practice</p>
              <div className="flex items-center gap-2 text-xs font-medium mt-1">
                <span className="text-foreground/80">Last: <span className="font-bold text-amber-500">{status.lastAttempt.totalScore}</span>/1600</span>
                {!status.canTakeTest && status.nextAvailableDate && (
                  <>
                    <span className="text-muted-foreground/40">|</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      Unlocks in {formatDaysUntil(status.nextAvailableDate)}
                    </span>
                  </>
                )}
                {status.canTakeTest && (
                  <>
                    <span className="text-muted-foreground/40">|</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Ready to Challenge
                    </span>
                  </>
                )}
              </div>
            </div>
            <ArrowRight className={`h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1 ${status.canTakeTest ? 'text-amber-500' : 'text-muted-foreground'}`} />
          </div>
        </motion.div>
      </Link>
    );
  }

  // No attempts yet
  return (
    <Link href="/full-sat" className="block group">
      <motion.div 
        whileHover={{ scale: 1.02, y: -2 }}
        className="relative overflow-hidden rounded-xl border border-blue-500/30 bg-card/60 p-5 backdrop-blur-md transition-all hover:border-blue-500/80 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-4 z-10">
          <div className="relative rounded-xl bg-blue-500/20 p-3 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <FileText className="h-6 w-6 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-foreground drop-shadow-sm">Full SAT Trial</p>
            <p className="text-xs text-muted-foreground mt-1">
              Test your might in a 98-question gauntlet
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-blue-400 shrink-0 transition-transform group-hover:translate-x-1" />
        </div>
      </motion.div>
    </Link>
  );
}

"use client";

import { Star, Target, Flame } from "lucide-react";
import { AnimatedSprite } from "@/components/pixel-art/animated-sprite";

export function ProgressHeader() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-card/70 p-5 backdrop-blur-xl">
      <div className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full bg-sky-400/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -right-8 h-24 w-24 rounded-full bg-emerald-400/20 blur-2xl" />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl border border-primary/25 bg-primary/10 p-2 shadow-[0_0_18px_rgba(14,165,233,0.25)]">
            <AnimatedSprite
              src="/images/pixel-art/profile-avatar.png"
              alt="Avatar"
              width={64}
              height={64}
            />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
              Progress
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">SAT Progress</h1>
            <p className="text-sm text-muted-foreground">
              Digital SAT &middot; 1600 scale
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/35 bg-sky-100/60 px-3 py-1 text-[11px] font-semibold text-sky-800 dark:bg-sky-400/10 dark:text-sky-300">
            <Target className="h-3.5 w-3.5" /> Target Lock
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/35 bg-amber-100/60 px-3 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
            <Flame className="h-3.5 w-3.5" /> Streak Engine
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/35 bg-emerald-100/60 px-3 py-1 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">
            <Star className="h-3.5 w-3.5" /> Mastery Track
          </div>
        </div>
      </div>
    </div>
  );
}

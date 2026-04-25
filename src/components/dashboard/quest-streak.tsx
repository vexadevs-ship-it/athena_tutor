"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";

type StreakDay = {
  day: string;
  completed: boolean;
  isPast: boolean;
};

export function QuestStreak({
  streak,
  days,
}: {
  streak: number;
  days: StreakDay[];
}) {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="relative overflow-hidden rounded-xl border border-athena-amber/20 bg-card/40 p-5 backdrop-blur-md transition-all hover:border-athena-amber/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]"
    >
      <div className="absolute top-0 right-0 h-32 w-32 bg-athena-amber/5 blur-3xl pointer-events-none" />
      
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground drop-shadow-sm">
          Quest Streak
        </h3>
        <div className="flex items-center gap-1.5 rounded-full bg-athena-amber/10 px-2.5 py-1 border border-athena-amber/20">
          <Flame className="h-3.5 w-3.5 text-athena-amber drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
          <span className="text-xs font-black text-athena-amber drop-shadow-sm">
            {streak} Day{streak !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-2 relative z-10">
        {days.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2 group relative">
            {/* Tooltip on hover (optional) */}
            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 text-[10px] font-bold px-2 py-1 rounded border border-border/50 shadow-lg pointer-events-none whitespace-nowrap z-20">
              {d.completed ? "Completed!" : d.isPast ? "Missed" : "Upcoming"}
            </div>
            
            <div
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
                d.completed
                  ? "bg-gradient-to-br from-athena-amber/20 to-athena-amber/5 border border-athena-amber shadow-[0_0_10px_rgba(251,191,36,0.4)] scale-110"
                  : d.isPast
                    ? "bg-muted/50 border border-muted-foreground/20 opacity-50"
                    : "border-2 border-dashed border-muted-foreground/30 bg-transparent"
              )}
            >
              {d.completed && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="h-3 w-3 rounded-full bg-athena-amber drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" 
                />
              )}
            </div>
            <span
              className={cn(
                "text-[10px] font-bold tracking-wider uppercase transition-colors",
                d.completed ? "text-athena-amber drop-shadow-sm" : d.isPast ? "text-muted-foreground/50" : "text-muted-foreground"
              )}
            >
              {d.day}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

"use client";

import { Clock, BellRing } from "lucide-react";
import { motion } from "framer-motion";

function formatTime(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function DailyStudyReminder({ time }: { time: string | null }) {
  if (!time) return null;

  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-blue-500/20 bg-card/40 px-5 py-4 backdrop-blur-md transition-all hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
      <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10">
        <BellRing className="h-5 w-5 text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)] group-hover:animate-bounce" />
      </div>
      <div className="flex-1 relative z-10">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
          Daily Training
        </span>
        <div className="flex items-center gap-2 mt-0.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Scheduled for <span className="font-bold text-blue-300 drop-shadow-sm">{formatTime(time)}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Swords } from "lucide-react";

type BattleZone = {
  name: string;
  slug: string;
  done: number;
};

export function BattleZones({ zones }: { zones: BattleZone[] }) {
  if (zones.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-athena-amber/20 bg-card/40 p-5 backdrop-blur-md">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Battle Zones
        </h3>
        <p className="text-sm text-muted-foreground/70 font-medium">
          Enter the arena and complete quests to unlock your battle zones.
        </p>
      </div>
    );
  }

  const maxDone = Math.max(...zones.map((z) => z.done), 1);

  return (
    <div className="relative overflow-hidden rounded-xl border border-purple-500/20 bg-card/40 p-5 backdrop-blur-md shadow-lg">
      <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-2 mb-6">
        <Swords className="h-5 w-5 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground drop-shadow-sm">
          Battle Zones
        </h3>
      </div>
      
      <div className="space-y-5 relative z-10">
        {zones.map((zone, i) => {
          const pct = Math.round((zone.done / maxDone) * 100);
          return (
            <div key={zone.slug} className="group">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground drop-shadow-sm tracking-wide">
                  {zone.name}
                </span>
                <span className="text-xs font-black text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">
                  {zone.done} <span className="text-[10px] text-muted-foreground">CLEARED</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden bg-background/50 rounded-full border border-border/50">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
                  className="relative h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.6)]"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }} />
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

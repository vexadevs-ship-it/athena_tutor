"use client";

import Link from "next/link";
import { Clock, ArrowRight, Zap, Flame, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SubtopicCardProps = {
  slug: string;
  name: string;
  difficulty: string;
  estimatedMinutes: number;
  description: string;
};

const difficultyConfig: Record<string, {
  label: string;
  badgeClass: string;
  borderClass: string;
  glowClass: string;
  icon: typeof Zap;
  iconClass: string;
  shadowColor: string;
}> = {
  easy: {
    label: "Training",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    borderClass: "hover:border-emerald-500/50",
    glowClass: "hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]",
    icon: Shield,
    iconClass: "text-emerald-400",
    shadowColor: "rgba(16,185,129,0.4)",
  },
  medium: {
    label: "Skirmish",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    borderClass: "hover:border-amber-500/50",
    glowClass: "hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]",
    icon: Flame,
    iconClass: "text-amber-400",
    shadowColor: "rgba(245,158,11,0.4)",
  },
  hard: {
    label: "Boss Raid",
    badgeClass: "bg-red-500/10 text-red-400 border-red-500/20",
    borderClass: "hover:border-red-500/50",
    glowClass: "hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]",
    icon: Zap,
    iconClass: "text-red-400",
    shadowColor: "rgba(239,68,68,0.4)",
  },
};

export function SubtopicCard({
  subtopic,
  topicSlug,
}: {
  subtopic: SubtopicCardProps;
  topicSlug: string;
}) {
  const config = difficultyConfig[subtopic.difficulty] ?? difficultyConfig.medium;
  const DiffIcon = config.icon;

  return (
    <Link href={`/learning/${topicSlug}/${subtopic.slug}/micro-lesson`} className="block group">
      <motion.div
        whileHover={{ scale: 1.02, y: -5 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 transition-all duration-500",
          config.borderClass,
          config.glowClass,
        )}
      >
        {/* Top hover accent line */}
        <div className={cn(
          "absolute top-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-700 rounded-t-3xl shadow-[0_0_15px_var(--shadow-color)]",
          subtopic.difficulty === "easy" ? "bg-emerald-500" :
          subtopic.difficulty === "hard" ? "bg-red-500" :
          "bg-amber-500"
        )} style={{ "--shadow-color": config.shadowColor } as any} />

        {/* Ambient background glow on hover */}
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-br from-white/5 to-transparent",
        )} />

        <div className="relative z-10 space-y-4">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div>
               <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Mission Code: {subtopic.slug.slice(0, 4).toUpperCase()}</span>
               </div>
               <h3 className="text-base font-black leading-tight text-foreground uppercase tracking-tight group-hover:text-primary transition-colors duration-300">
                 {subtopic.name}
               </h3>
            </div>
            <span className={cn(
              "shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest border shadow-inner",
              config.badgeClass
            )}>
              <DiffIcon className={cn("h-3 w-3", config.iconClass)} />
              {config.label}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
            {subtopic.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>{subtopic.estimatedMinutes} Min Duration</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
              <ArrowRight className="h-4 w-4 text-white transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

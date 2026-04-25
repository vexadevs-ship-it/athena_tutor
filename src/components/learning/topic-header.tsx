"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Target, BookOpen } from "lucide-react";
import { getTopicIcon } from "@/lib/topic-icons";

type TopicHeaderProps = {
  slug: string;
  name: string;
  overview: string;
  estimatedTotalMinutes: number;
  satRelevance: { percentageOfTest: number; description: string };
  difficultyDistribution: { easy: number; medium: number; hard: number };
};

function TopicIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = getTopicIcon(slug);
  return React.createElement(Icon, { className });
}

export function TopicHeader({ topic }: { topic: TopicHeaderProps }) {
  const total =
    topic.difficultyDistribution.easy +
    topic.difficultyDistribution.medium +
    topic.difficultyDistribution.hard;

  const easyPct = total > 0 ? (topic.difficultyDistribution.easy / total) * 100 : 0;
  const medPct = total > 0 ? (topic.difficultyDistribution.medium / total) * 100 : 0;
  const hardPct = total > 0 ? (topic.difficultyDistribution.hard / total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl p-8 shadow-2xl"
    >
      {/* Ambient glow backgrounds */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-athena-amber/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Icon + title */}
        <div className="flex items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.3)] ring-1 ring-primary/50">
            <TopicIcon
              slug={topic.slug}
              className="h-8 w-8 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <div className="h-1 w-1 rounded-full bg-athena-amber animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-athena-amber">Battle Discipline</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {topic.name}
            </h1>
          </div>
        </div>

        {/* Overview */}
        <div className="relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-transparent rounded-full" />
          <p className="text-base text-muted-foreground leading-relaxed italic pl-2">
            &ldquo;{topic.overview}&rdquo;
          </p>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-6 pt-2">
          <div className="group flex items-center gap-2.5 rounded-2xl bg-white/5 border border-white/10 px-4 py-2.5 transition-all hover:bg-white/10 hover:border-white/20">
            <Clock className="h-4 w-4 text-primary" />
            <div className="flex flex-col">
               <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Estimated Time</span>
               <span className="text-sm font-black text-foreground">{topic.estimatedTotalMinutes} Minutes</span>
            </div>
          </div>
          <div className="group flex items-center gap-2.5 rounded-2xl bg-white/5 border border-white/10 px-4 py-2.5 transition-all hover:bg-white/10 hover:border-white/20">
            <Target className="h-4 w-4 text-athena-amber" />
            <div className="flex flex-col">
               <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">SAT Relevance</span>
               <span className="text-sm font-black text-foreground">{topic.satRelevance.percentageOfTest}% of Test</span>
            </div>
          </div>

          {/* Difficulty bar */}
          {total > 0 && (
            <div className="flex flex-col gap-2 min-w-[180px]">
               <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Difficulty Spread</span>
               <div className="flex h-3 w-full overflow-hidden rounded-full bg-black/40 border border-white/5 shadow-inner">
                 <motion.div
                   className="bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                   initial={{ width: 0 }}
                   animate={{ width: `${easyPct}%` }}
                   transition={{ duration: 1, ease: "easeOut" }}
                 />
                 <motion.div
                   className="bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                   initial={{ width: 0 }}
                   animate={{ width: `${medPct}%` }}
                   transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
                 />
                 <motion.div
                   className="bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                   initial={{ width: 0 }}
                   animate={{ width: `${hardPct}%` }}
                   transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                 />
               </div>
               <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-tighter">
                 <span className="text-emerald-400">Easy ({topic.difficultyDistribution.easy})</span>
                 <span className="text-amber-400">Med ({topic.difficultyDistribution.medium})</span>
                 <span className="text-red-400">Hard ({topic.difficultyDistribution.hard})</span>
               </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

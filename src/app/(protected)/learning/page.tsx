"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Clock, Target, BookOpen, Sparkles } from "lucide-react";
import { getTopicIcon } from "@/lib/topic-icons";
import { cn } from "@/lib/utils";
import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";

type Topic = {
  id: string;
  slug: string;
  name: string;
  overview: string;
  estimatedTotalMinutes: number;
  satRelevance: { percentageOfTest: number };
  subtopics: { id: string }[];
  subject: string;
};

const SUBJECTS = [
  { key: "math", label: "Math", color: "blue" },
  { key: "reading-writing", label: "Reading & Writing", color: "purple" },
] as const;

const SUBJECT_STYLES = {
  math: {
    active: "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]",
    icon: "text-blue-500 dark:text-blue-400",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20",
    bar: "from-blue-500 to-blue-400",
    shadow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]",
    border: "hover:border-blue-500/40",
    glow: "bg-blue-500/5",
  },
  "reading-writing": {
    active: "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]",
    icon: "text-purple-500 dark:text-purple-400",
    iconBg: "bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/20",
    bar: "from-purple-500 to-purple-400",
    shadow: "hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]",
    border: "hover:border-purple-500/40",
    glow: "bg-purple-500/5",
  },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function LearningPage() {
  const [activeSubject, setActiveSubject] = useState<string>("math");

  const {
    data,
    isLoading: loading,
    isError,
  } = useQuery<{ topics: Topic[] }>({
    queryKey: ["learning"],
    queryFn: () =>
      fetch("/api/learning").then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    staleTime: 10 * 60_000,
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load learning data");
  }, [isError]);

  const topics = data?.topics ?? [];
  const filteredTopics = topics.filter((t) => t.subject === activeSubject);
  const styles = SUBJECT_STYLES[activeSubject as keyof typeof SUBJECT_STYLES];

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="relative z-10 mx-auto max-w-4xl p-6 space-y-8">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4">
            <SkeletonShimmer className="h-12 w-12 rounded-2xl" />
            <div className="space-y-2">
              <SkeletonShimmer className="h-8 w-64 rounded-lg" />
              <SkeletonShimmer className="h-4 w-48 rounded-lg" />
            </div>
          </div>

          {/* Tabs Skeleton */}
          <div className="flex gap-3">
            <SkeletonShimmer className="h-9 w-24 rounded-full" />
            <SkeletonShimmer className="h-9 w-40 rounded-full" />
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonShimmer key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="relative z-10 mx-auto max-w-4xl p-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-10 flex items-center gap-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              Learning Arsenal
            </h1>
            <p className="text-xs text-athena-amber font-black uppercase tracking-widest mt-0.5">
              Select your discipline &bull; Forge your mastery
            </p>
          </div>
        </motion.div>

        {/* Subject Tabs */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 flex gap-3"
        >
          {SUBJECTS.map((s) => {
            const isActive = activeSubject === s.key;
            const subStyle = SUBJECT_STYLES[s.key as keyof typeof SUBJECT_STYLES];
            return (
              <button
                key={s.key}
                onClick={() => setActiveSubject(s.key)}
                className={cn(
                  "relative rounded-full px-5 py-2 text-sm font-bold tracking-wide transition-all duration-300 border",
                  isActive
                    ? `${subStyle.active} border-transparent`
                    : "bg-card/60 text-muted-foreground border-border/50 hover:bg-muted/60 hover:text-foreground backdrop-blur-sm"
                )}
              >
                {s.label}
              </button>
            );
          })}
        </motion.div>

        {/* Topic Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubject}
            variants={stagger}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {filteredTopics.map((topic) => {
              const Icon = getTopicIcon(topic.slug);
              const satPct = topic.satRelevance.percentageOfTest;
              return (
                <motion.div key={topic.id} variants={cardVariant}>
                  <Link href={`/learning/${topic.slug}`} className="block group">
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm transition-all duration-300",
                        styles.shadow,
                        styles.border,
                        "hover:-translate-y-1"
                      )}
                    >
                      {/* Hover glow background */}
                      <div className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                        styles.glow
                      )} />

                      {/* Top accent line */}
                      <div className={cn(
                        "absolute top-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r rounded-t-2xl",
                        styles.bar
                      )} />

                      <div className="relative z-10">
                        {/* Icon + Title */}
                        <div className="flex items-start gap-4 mb-3">
                          <div className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-110",
                            styles.iconBg
                          )}>
                            <Icon className={cn("h-6 w-6", styles.icon)} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h2 className="font-black text-foreground text-sm uppercase tracking-wide group-hover:text-athena-amber transition-colors">
                              {topic.name}
                            </h2>
                            <div className="flex items-center gap-1.5 mt-1">
                               <Sparkles className={cn("h-3 w-3", styles.icon)} />
                               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                 {topic.subtopics.length} Missions
                               </p>
                            </div>
                          </div>
                        </div>

                        {/* Overview */}
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                          {topic.overview}
                        </p>

                        {/* Stats row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {topic.estimatedTotalMinutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="h-3.5 w-3.5" />
                              {satPct}% of SAT
                            </span>
                          </div>

                          {/* SAT weight mini bar */}
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(satPct * 4, 100)}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={cn("h-full rounded-full bg-gradient-to-r", styles.bar)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {filteredTopics.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-20 text-center gap-3"
          >
            <Sparkles className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">
              No topics available yet for this subject.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

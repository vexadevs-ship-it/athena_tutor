"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { motion, type Variants } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ProgressHeader } from "@/components/progress/progress-header";
import { SectionScores } from "@/components/progress/section-scores";
import { SatSkills } from "@/components/progress/sat-skills";
import { CompositeScore } from "@/components/progress/composite-score";
import { ScoreHistory } from "@/components/progress/score-history";
import { StudyStats } from "@/components/progress/study-stats";
import { TopicMastery } from "@/components/progress/topic-mastery";
import { PracticeTestResults } from "@/components/progress/practice-test-results";
import { JourneyRanks } from "@/components/progress/journey-ranks";
import { Sparkles, TrendingUp, Shield, Zap, Crosshair, Clock3, Medal } from "lucide-react";
import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";

type ProgressData = {
  user: {
    displayName: string | null;
    avatarUrl: string | null;
    targetScore: number | null;
    skillScore: number | null;
  };
  targetScore: number | null;
  scoreHistory: { date: string; score: number }[];
  accuracyByDifficulty: {
    difficulty: string;
    total: number;
    correct: number;
    accuracy: number;
  }[];
  topicPerformance: {
    name: string;
    slug: string;
    subject: string;
    total: number;
    correct: number;
    accuracy: number;
  }[];
  recentSessions: {
    id: string;
    subtopicName: string;
    score: number;
    totalQuestions: number;
    timeElapsedSeconds: number;
    date: string;
  }[];
  overallStats: {
    totalQuestions: number;
    accuracy: number;
    totalTimeSeconds: number;
    sessionCount: number;
    avgScore: number;
  };
  sectionScores: {
    readingWriting: {
      subject: string;
      total: number;
      correct: number;
      accuracy: number;
      scaledScore: number;
    };
    math: {
      subject: string;
      total: number;
      correct: number;
      accuracy: number;
      scaledScore: number;
    };
  };
  topicMastery: {
    items: {
      name: string;
      mastered: boolean;
      attempted: boolean;
    }[];
    masteredCount: number;
    totalCount: number;
  };
};

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function ProgressPage() {
  const {
    data,
    isLoading: loading,
    isError,
  } = useQuery<ProgressData>({
    queryKey: ["progress"],
    queryFn: () =>
      fetch("/api/progress").then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load progress data");
  }, [isError]);

  if (loading) {
    return (
        <div className="relative z-10 mx-auto max-w-6xl p-6 space-y-6">
          {/* Header Card Skeleton */}
          <div className="rounded-3xl border border-white/10 bg-card/40 p-6 backdrop-blur-sm">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-center gap-4">
                <SkeletonShimmer className="h-12 w-12 rounded-2xl" />
                <div className="space-y-2">
                  <SkeletonShimmer className="h-8 w-48 rounded-lg" />
                  <SkeletonShimmer className="h-4 w-32 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <SkeletonShimmer className="h-16 rounded-2xl" />
                <SkeletonShimmer className="h-16 rounded-2xl" />
                <SkeletonShimmer className="h-16 rounded-2xl" />
              </div>
            </div>
          </div>

          {/* Progress Header Skeleton */}
          <SkeletonShimmer className="h-24 w-full rounded-3xl" />

          {/* Stats Trio Skeleton */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SkeletonShimmer className="h-24 rounded-2xl" />
            <SkeletonShimmer className="h-24 rounded-2xl" />
            <SkeletonShimmer className="h-24 rounded-2xl" />
          </div>

          {/* Section Mastery Grid Skeleton */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
             <div className="lg:col-span-3 space-y-6">
               <SkeletonShimmer className="h-64 rounded-3xl" />
               <SkeletonShimmer className="h-48 rounded-3xl" />
             </div>
             <div className="lg:col-span-2 space-y-6">
               <SkeletonShimmer className="h-[460px] rounded-3xl" />
             </div>
          </div>
        </div>
    );
  }

  if (!data) return null;

  const compositeScore =
    data.sectionScores.readingWriting.scaledScore +
    data.sectionScores.math.scaledScore;
  const targetScore = data.user.targetScore ?? data.targetScore ?? 1400;
  const scoreGap = Math.max(0, targetScore - compositeScore);

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="relative z-10 p-4 sm:p-6">
        <motion.div
          className="mx-auto max-w-6xl"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={staggerItem} className="mb-6 rounded-3xl border border-white/20 bg-card/65 p-5 backdrop-blur-xl">
            <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] md:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 shadow-[0_0_18px_rgba(14,165,233,0.28)]">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-foreground">Hall of Progress</h1>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Your Academic Journey</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-sky-300/30 bg-sky-100/60 p-3 text-center dark:bg-sky-400/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Composite</p>
                  <p className="mt-1 text-xl font-black tabular-nums">{compositeScore}</p>
                </div>
                <div className="rounded-2xl border border-amber-300/30 bg-amber-100/60 p-3 text-center dark:bg-amber-400/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target</p>
                  <p className="mt-1 text-xl font-black tabular-nums">{targetScore}</p>
                </div>
                <div className="rounded-2xl border border-emerald-300/30 bg-emerald-100/60 p-3 text-center dark:bg-emerald-400/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gap</p>
                  <p className="mt-1 text-xl font-black tabular-nums">{scoreGap}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={staggerItem}>
            <ProgressHeader />
          </motion.div>

          <motion.div variants={staggerItem} className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="depth-panel p-3">
              <div className="inline-flex items-center gap-2 text-xs font-semibold">
                <Crosshair className="h-4 w-4 text-primary" /> Precision Track
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Skill profile updates after every session for faster adaptation.</p>
            </div>
            <div className="depth-panel p-3">
              <div className="inline-flex items-center gap-2 text-xs font-semibold">
                <Clock3 className="h-4 w-4 text-athena-amber" /> Time Discipline
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Monitor pacing consistency to reduce mistakes under pressure.</p>
            </div>
            <div className="depth-panel p-3">
              <div className="inline-flex items-center gap-2 text-xs font-semibold">
                <Medal className="h-4 w-4 text-emerald-500" /> Rank Momentum
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Complete focused sessions to climb tiers faster this week.</p>
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="mt-9 mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-athena-amber" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Section Mastery
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-6">
              <motion.div variants={staggerItem}>
                <div className="depth-panel p-6 hover-lift">
                  <SectionScores
                    rw={data.sectionScores.readingWriting}
                    math={data.sectionScores.math}
                    targetScore={targetScore}
                  />
                </div>
              </motion.div>

              <motion.div variants={staggerItem}>
                <div className="rounded-3xl border border-athena-amber/30 bg-gradient-to-br from-athena-amber/10 to-card/70 p-6 backdrop-blur-xl shadow-[0_12px_28px_rgba(245,158,11,0.12)] hover-lift">
                  <CompositeScore
                    score={compositeScore}
                    targetScore={targetScore}
                  />
                </div>
              </motion.div>
            </div>

            <motion.div className="lg:col-span-2" variants={staggerItem}>
              <div className="depth-panel h-full p-6 hover-lift">
                <SatSkills topics={data.topicPerformance} />
              </div>
            </motion.div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
            <motion.div className="lg:col-span-3" variants={staggerItem}>
              <div className="depth-panel h-full p-6">
                <div className="flex items-center gap-2 mb-6">
                   <Sparkles className="h-4 w-4 text-athena-amber" />
                   <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Score Evolution</h3>
                </div>
                <ScoreHistory data={data.scoreHistory} />
              </div>
            </motion.div>
            <div className="lg:col-span-2 space-y-6">
              <motion.div variants={staggerItem}>
                <div className="depth-panel p-6">
                  <StudyStats stats={data.overallStats} />
                </div>
              </motion.div>
              <motion.div variants={staggerItem}>
                <div className="depth-panel p-6">
                  <TopicMastery mastery={data.topicMastery} />
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div className="mt-8" variants={staggerItem}>
            <div className="depth-panel p-6">
              <div className="flex items-center gap-2 mb-6">
                 <Zap className="h-4 w-4 text-primary" />
                 <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Recent Encounters</h3>
              </div>
              <PracticeTestResults sessions={data.recentSessions} />
            </div>
          </motion.div>

          <motion.div className="mt-8" variants={staggerItem}>
            <div className="rounded-3xl border border-athena-amber/30 bg-gradient-to-br from-athena-amber/10 to-card/70 p-6 backdrop-blur-xl shadow-[0_12px_32px_rgba(245,158,11,0.12)] hover-lift">
              <JourneyRanks currentScore={compositeScore} />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

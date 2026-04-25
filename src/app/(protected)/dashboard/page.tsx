"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Brain, ChartSpline, Sword, Trophy, Sparkles, Bolt } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import { WelcomeHeader } from "@/components/dashboard/welcome-header";
import { RankCard } from "@/components/dashboard/rank-card";
import { DailyStudyReminder } from "@/components/dashboard/daily-study-reminder";
import { DailyQuestCard } from "@/components/dashboard/daily-quest-card";
import { QuestStreak } from "@/components/dashboard/quest-streak";
import { BattleZones } from "@/components/dashboard/battle-zones";
import { CompanionCard } from "@/components/dashboard/companion-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { FriendsLeaderboard } from "@/components/dashboard/friends-leaderboard";
import { FullSatCard } from "@/components/dashboard/full-sat-card";
import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";

type StreakDay = {
  day: string;
  completed: boolean;
  isPast: boolean;
};

type BattleZone = {
  name: string;
  slug: string;
  done: number;
};

type FriendScore = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalScore: number;
  weeklyDelta: number;
};

type DashboardData = {
  user: {
    displayName: string | null;
    skillScore: number | null;
    avatarUrl: string | null;
    targetScore: number | null;
  };
  upcomingSessions: any[];
  queueItems: any[];
  totalQueueCount: number;
  completedLessonCount: number;
  completedSessions: number;
  totalSessions: number;
  streak: number;
  totalScore: number;
  weeklyDelta: number;
  topics: { slug: string; name: string; subtopicCount: number }[];
  weeklyStreakDays: StreakDay[];
  battleZones: BattleZone[];
  todayStudyTime: string | null;
  targetScore: number | null;
  friendsScores: FriendScore[];
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
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const quickActions = [
  {
    href: "/learning",
    title: "Explore Review Modules",
    body: "Jump into subtopics, micro-lessons, and graph-rich practice.",
    icon: Brain,
    accent: "from-sky-500/35 to-cyan-500/20",
  },
  {
    href: "/quest",
    title: "Play Daily Quest",
    body: "Tackle adaptive battles with live tutor intervention.",
    icon: Sword,
    accent: "from-amber-500/35 to-orange-500/20",
  },
  {
    href: "/profile",
    title: "Track Score Growth",
    body: "Review streak momentum and rank progression insights.",
    icon: ChartSpline,
    accent: "from-emerald-500/35 to-teal-500/20",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { data: userData, loading: userLoading } = useCurrentUser();

  const readyToLoad =
    !userLoading && !!userData && userData.user.onboardingCompleted;

  const {
    data,
    isLoading: dashLoading,
    isError,
  } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () =>
      fetch("/api/dashboard").then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    staleTime: 60_000,
    enabled: readyToLoad,
  });

  useEffect(() => {
    if (!userLoading && userData && !userData.user.onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [userData, userLoading, router]);

  useEffect(() => {
    if (isError) toast.error("Failed to load dashboard data");
  }, [isError]);

  const loading = userLoading || dashLoading;

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6 space-y-6">
        {/* Command Center Skeleton */}
        <div className="rounded-3xl border border-white/10 bg-card/40 p-6 backdrop-blur-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <SkeletonShimmer className="h-4 w-32 rounded-lg" />
              <SkeletonShimmer className="h-8 w-64 rounded-lg" />
              <SkeletonShimmer className="h-12 w-full rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SkeletonShimmer className="h-16 rounded-2xl" />
              <SkeletonShimmer className="h-16 rounded-2xl" />
              <SkeletonShimmer className="h-16 col-span-2 rounded-2xl" />
            </div>
          </div>
        </div>

        {/* Welcome Header Skeleton */}
        <div className="flex items-center gap-4">
          <SkeletonShimmer className="h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <SkeletonShimmer className="h-6 w-48 rounded-lg" />
            <SkeletonShimmer className="h-4 w-32 rounded-lg" />
          </div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <SkeletonShimmer key={idx} className="h-32 rounded-2xl" />
          ))}
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <SkeletonShimmer className="h-48 rounded-2xl" />
            <SkeletonShimmer className="h-24 rounded-2xl" />
            <SkeletonShimmer className="h-56 rounded-2xl" />
            <SkeletonShimmer className="h-32 rounded-2xl" />
          </div>
          <div className="space-y-6 lg:col-span-2">
            <SkeletonShimmer className="h-64 rounded-2xl" />
            <SkeletonShimmer className="h-48 rounded-2xl" />
            <SkeletonShimmer className="h-72 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="relative z-10 p-4 sm:p-6">
        <motion.div
          className="mx-auto max-w-6xl"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={staggerItem} className="mb-5 rounded-3xl border border-white/20 bg-card/70 p-5 backdrop-blur-xl">
            <div className="grid gap-4 md:grid-cols-[1.35fr_1fr] md:items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Athena Command Center</p>
                <h2 className="mt-1 text-3xl font-black tracking-tight">Design your next mastery streak</h2>
                <p className="mt-2 text-sm text-muted-foreground">Adaptive quests, rich review modules, and SAT simulation in one focused workspace.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-sky-300/30 bg-sky-100/55 p-3 dark:bg-sky-400/10">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold"><Sparkles className="h-3.5 w-3.5 text-sky-600" /> Momentum</div>
                  <p className="mt-1 text-[11px] text-muted-foreground">Daily wins compound.</p>
                </div>
                <div className="rounded-2xl border border-amber-300/30 bg-amber-100/55 p-3 dark:bg-amber-400/10">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold"><Bolt className="h-3.5 w-3.5 text-amber-600" /> Focus</div>
                  <p className="mt-1 text-[11px] text-muted-foreground">Short intense sessions.</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-emerald-300/30 bg-emerald-100/45 p-3 dark:bg-emerald-400/10">
                  <p className="text-[11px] font-semibold">Tip: Pair Daily Quest with one hard Review module for higher weekly delta.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Welcome Header */}
          <motion.div variants={staggerItem}>
            <WelcomeHeader
              displayName={data.user.displayName}
              avatarUrl={data.user.avatarUrl}
            />
          </motion.div>

          <motion.div variants={staggerItem} className="mb-5 mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
            {quickActions.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="group">
                  <div className="depth-panel hover-lift relative overflow-hidden p-4">
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-45`} />
                    <div className="relative z-10 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
                      </div>
                      <div className="rounded-lg border border-white/30 bg-background/70 p-2">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="relative z-10 mt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                      Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </motion.div>

          {/* Two-column layout */}
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Left column (main) */}
            <motion.div
              className="space-y-5 lg:col-span-3"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={staggerItem}>
                <RankCard
                  totalScore={data.totalScore}
                  weeklyDelta={data.weeklyDelta}
                />
              </motion.div>

              <motion.div variants={staggerItem}>
                <DailyStudyReminder time={data.todayStudyTime} />
              </motion.div>

              <motion.div variants={staggerItem}>
                <DailyQuestCard />
              </motion.div>

              <motion.div variants={staggerItem}>
                <FullSatCard />
              </motion.div>

              <motion.div variants={staggerItem}>
                <div className="depth-panel hover-lift p-4">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-100/50 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
                    <Trophy className="h-3.5 w-3.5" /> Weekly Focus
                  </div>
                  <p className="text-sm text-muted-foreground">Keep a 5-day streak and solve one hard problem set to unlock a double-XP weekend boost.</p>
                </div>
              </motion.div>

              <motion.div variants={staggerItem}>
                <QuestStreak
                  streak={data.streak}
                  days={data.weeklyStreakDays}
                />
              </motion.div>

              <motion.div variants={staggerItem}>
                <BattleZones zones={data.battleZones} />
              </motion.div>
            </motion.div>

            {/* Right column (sidebar) */}
            <motion.div
              className="space-y-5 lg:col-span-2"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={staggerItem}>
                <CompanionCard />
              </motion.div>

              <motion.div variants={staggerItem}>
                <StatsCards
                  targetScore={data.user.targetScore ?? data.targetScore}
                  sessionsCount={data.completedSessions}
                />
              </motion.div>

              <motion.div variants={staggerItem}>
                <FriendsLeaderboard friends={data.friendsScores} />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

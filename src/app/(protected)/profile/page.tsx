"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, type Variants } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AnimatedSprite } from "@/components/pixel-art/animated-sprite";
import { ProfileNameEditor } from "@/components/profile/profile-name-editor";
import { ProfileStreak } from "@/components/profile/profile-streak";
import { SatScoreHistory } from "@/components/profile/sat-score-history";
import { ScheduleEditor } from "@/components/profile/schedule-editor";
import {
  Trophy, Flame, Clock, Target, Zap, Shield, Star, TrendingUp, CheckCircle
} from "lucide-react";

type TierInfo = {
  name: string;
  threshold: number;
  weapon: string;
  emoji: string;
  active: boolean;
};

type SatAttempt = {
  id: string;
  totalScore: number | null;
  rwScaledScore: number | null;
  mathScaledScore: number | null;
  completedAt: string | null;
};

type StreakDay = {
  day: string;
  completed: boolean;
  isPast: boolean;
};

type ProfileData = {
  user: {
    displayName: string | null;
    avatarUrl: string | null;
    createdAt: string;
    targetScore: number | null;
    bestStreak: number;
  } | null;
  totalScore: number;
  questsDone: number;
  totalTimeSeconds: number;
  accuracy: number;
  streak: number;
  bestStreak: number;
  latestSatAttempt: SatAttempt | null;
  weeklyStreakDays: StreakDay[];
  rank: {
    current: { name: string; weapon: string; emoji: string; threshold: number };
    next: { name: string; weapon: string; emoji: string; threshold: number } | null;
    pct: number;
    pointsToNext: number;
  };
  tiers: TierInfo[];
};

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STAT_CONFIG = [
  {
    key: "questsDone",
    label: "Quests Done",
    icon: CheckCircle,
    color: "emerald",
    gradient: "from-emerald-500/20 to-emerald-400/5",
    border: "border-emerald-500/20 hover:border-emerald-500/50",
    text: "text-emerald-600 dark:text-emerald-400",
    glow: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]",
    iconGlow: "drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]",
  },
  {
    key: "totalTime",
    label: "Total Time",
    icon: Clock,
    color: "blue",
    gradient: "from-blue-500/20 to-blue-400/5",
    border: "border-blue-500/20 hover:border-blue-500/50",
    text: "text-blue-600 dark:text-blue-400",
    glow: "group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]",
    iconGlow: "drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]",
  },
  {
    key: "bestStreak",
    label: "Best Streak",
    icon: Flame,
    color: "amber",
    gradient: "from-amber-500/20 to-amber-400/5",
    border: "border-amber-500/20 hover:border-amber-500/50",
    text: "text-amber-600 dark:text-amber-400",
    glow: "group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]",
    iconGlow: "drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]",
  },
  {
    key: "accuracy",
    label: "Accuracy",
    icon: Target,
    color: "purple",
    gradient: "from-purple-500/20 to-purple-400/5",
    border: "border-purple-500/20 hover:border-purple-500/50",
    text: "text-purple-600 dark:text-purple-400",
    glow: "group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]",
    iconGlow: "drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]",
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { data: userData, loading: userLoading } = useCurrentUser();

  const readyToLoad =
    !userLoading && !!userData && userData.user.onboardingCompleted;

  const {
    data,
    isLoading: profileLoading,
    isError,
  } = useQuery<ProfileData>({
    queryKey: ["profile"],
    queryFn: () =>
      fetch("/api/profile").then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    staleTime: 2 * 60_000,
    enabled: readyToLoad,
  });

  useEffect(() => {
    if (!userLoading && userData && !userData.user.onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [userData, userLoading, router]);

  useEffect(() => {
    if (isError) toast.error("Failed to load profile data");
  }, [isError]);

  const loading = userLoading || profileLoading;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="relative z-10 mx-auto max-w-5xl p-6 space-y-6">
          <div className="h-10 w-56 bg-muted/60 rounded-xl animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-muted/40 rounded-2xl animate-pulse border border-border/30" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-6">
              <div className="h-32 bg-muted/40 rounded-2xl animate-pulse border border-border/30" />
              <div className="h-48 bg-muted/40 rounded-2xl animate-pulse border border-border/30" />
            </div>
            <div className="space-y-4">
              <div className="h-40 bg-muted/40 rounded-2xl animate-pulse border border-border/30" />
              <div className="h-52 bg-muted/40 rounded-2xl animate-pulse border border-border/30" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.user) return null;

  const { user, totalScore, questsDone, totalTimeSeconds, accuracy, rank, tiers } = data;
  const bestStreak = Math.max(data.bestStreak, data.streak);

  const statValues: Record<string, string> = {
    questsDone: questsDone.toString(),
    totalTime: formatTime(totalTimeSeconds),
    bestStreak: `${bestStreak}d`,
    accuracy: `${accuracy}%`,
  };

  const progressPct = user.targetScore
    ? Math.min(Math.round((totalScore / user.targetScore) * 100), 100)
    : rank.pct;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="relative z-10 p-6">
        <motion.div
          className="mx-auto max-w-5xl"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {/* ── Hero Header ── */}
          <motion.div variants={staggerItem} className="mb-8">
            <div className="relative overflow-hidden rounded-2xl border border-athena-amber/20 bg-card/50 backdrop-blur-md p-6 shadow-lg">
              <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-athena-amber/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex items-center gap-5">
                {/* Avatar */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-athena-amber/40 bg-gradient-to-br from-athena-amber/20 to-primary/10 shadow-[0_0_25px_rgba(251,191,36,0.25)]"
                >
                  <AnimatedSprite
                    src="/images/pixel-art/profile-avatar.png"
                    alt="Avatar"
                    width={56}
                    height={56}
                  />
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border text-sm shadow">
                    {rank.current.emoji}
                  </div>
                </motion.div>

                {/* Name + Info */}
                <div className="flex-1 min-w-0">
                  <ProfileNameEditor displayName={user.displayName} />
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-muted-foreground font-medium">
                      Quest started {formatDate(user.createdAt)}
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs font-bold text-athena-amber drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">
                      {rank.current.emoji} {rank.current.name}
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground">{rank.current.weapon}</span>
                  </div>
                </div>

                {/* Total Score Pill */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="hidden sm:flex flex-col items-center gap-1 rounded-xl border border-athena-amber/30 bg-athena-amber/10 px-4 py-3"
                >
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-athena-amber drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                    <span className="text-2xl font-black text-athena-amber">{totalScore}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total XP</span>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* ── Stats Grid ── */}
          <motion.div variants={staggerItem} className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STAT_CONFIG.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.key}
                  whileHover={{ scale: 1.04, y: -3 }}
                  className={`group relative overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-sm p-5 transition-all duration-300 ${stat.border} ${stat.glow}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
                  <div className="relative z-10">
                    <Icon className={`h-5 w-5 mb-3 transition-all duration-300 ${stat.text} ${stat.iconGlow}`} />
                    <p className={`text-2xl font-black tracking-tight ${stat.text}`}>
                      {statValues[stat.key]}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                      {stat.label}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
            {/* Left */}
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">

              {/* Streak section */}
              <motion.div variants={staggerItem}>
                <div className="rounded-2xl border border-athena-amber/20 bg-card/50 backdrop-blur-md p-5 shadow-sm hover:border-athena-amber/40 hover:shadow-[0_0_20px_rgba(251,191,36,0.12)] transition-all duration-300">
                  <ProfileStreak
                    streak={data.streak}
                    bestStreak={bestStreak}
                    weeklyStreakDays={data.weeklyStreakDays}
                  />
                </div>
              </motion.div>

              {/* SAT Score History */}
              <motion.div variants={staggerItem}>
                <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-md p-5 shadow-sm hover:border-primary/30 hover:shadow-[0_0_15px_rgba(var(--primary),0.1)] transition-all duration-300">
                  <SatScoreHistory latestAttempt={data.latestSatAttempt} />
                </div>
              </motion.div>

              {/* Progress to Goal */}
              <motion.div variants={staggerItem}>
                <div className="group rounded-2xl border border-emerald-500/20 bg-card/50 backdrop-blur-md p-5 shadow-sm hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.12)] transition-all duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                      Progress to Goal
                    </h3>
                  </div>

                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-3xl font-black text-foreground">
                      {user.targetScore ?? rank.next?.threshold ?? totalScore}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {totalScore} XP
                      </span>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Current</p>
                    </div>
                  </div>

                  <div className="h-3 w-full overflow-hidden bg-background/60 rounded-full border border-border/50">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" style={{ backgroundSize: "200% 100%" }} />
                    </motion.div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground font-medium">{progressPct}% complete</span>
                    {rank.next && (
                      <p className="text-xs font-bold text-muted-foreground">
                        {rank.pointsToNext} XP → <span className="text-foreground">{rank.next.emoji} {rank.next.name}</span>
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right sidebar */}
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">

              {/* Schedule */}
              <motion.div variants={staggerItem}>
                <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-md p-5 shadow-sm hover:border-primary/30 transition-all duration-300">
                  <ScheduleEditor />
                </div>
              </motion.div>

              {/* Current Tier */}
              <motion.div variants={staggerItem}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="rounded-2xl border border-athena-amber/30 bg-gradient-to-br from-athena-amber/10 to-card/50 backdrop-blur-md p-5 shadow-sm hover:border-athena-amber/60 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)] transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-4 w-4 text-athena-amber drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Current Tier</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{rank.current.emoji}</span>
                    <div>
                      <p className="font-black text-foreground text-base">{rank.current.name}</p>
                      <p className="text-sm text-muted-foreground">{rank.current.weapon}</p>
                    </div>
                  </div>
                  {rank.next && (
                    <div className="mt-3 pt-3 border-t border-athena-amber/20">
                      <p className="text-xs text-muted-foreground">
                        <span className="text-athena-amber font-bold">{rank.pointsToNext} XP</span> until {rank.next.emoji} {rank.next.name}
                      </p>
                    </div>
                  )}
                </motion.div>
              </motion.div>

              {/* All Tiers */}
              <motion.div variants={staggerItem}>
                <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-md p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">All Tiers</h3>
                  </div>
                  <div className="space-y-1">
                    {tiers.map((tier) => (
                      <motion.div
                        key={tier.name}
                        whileHover={tier.active ? { x: 4 } : {}}
                        className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-sm transition-all duration-200 ${
                          tier.active
                            ? "text-foreground font-bold bg-primary/5 border border-primary/20"
                            : "text-muted-foreground/50"
                        }`}
                      >
                        <span className="text-base">{tier.emoji}</span>
                        <span className="flex-1">{tier.name}</span>
                        <span className="tabular-nums text-xs">{tier.threshold}</span>
                        {tier.active && <Star className="h-3 w-3 text-athena-amber fill-athena-amber" />}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Journey strip */}
          <motion.div variants={staggerItem} className="mt-8">
            <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-athena-amber fill-athena-amber" />
                Your Journey
              </p>
              <div className="flex gap-4 overflow-x-auto pb-1">
                {tiers.map((tier, i) => (
                  <motion.div
                    key={tier.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: tier.active ? 1 : 0.25, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={tier.active ? { scale: 1.2, y: -4 } : {}}
                    className={`flex shrink-0 flex-col items-center gap-1.5 transition-all duration-300 ${
                      tier.active ? "cursor-default" : ""
                    }`}
                  >
                    <span className="text-2xl">{tier.emoji}</span>
                    <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                      {tier.name}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

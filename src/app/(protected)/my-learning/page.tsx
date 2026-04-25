"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, Search, BookOpen, ArrowRight, Zap } from "lucide-react";

const SUGGESTED_TOPICS = [
  "Python basics",
  "World War II",
  "Photosynthesis",
  "The French Revolution",
  "Newton's laws of motion",
  "Supply and demand",
  "Mitosis vs meiosis",
  "The water cycle",
  "Shakespeare's tragedies",
  "Climate change",
];

type TopicSummary = { id: string; title: string; createdAt: string };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export default function MyLearningPage() {
  const router = useRouter();
  const { data: userData, loading: userLoading } = useCurrentUser();
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const enabled = !userLoading && !!userData;

  const { data, isError } = useQuery<{ topics: TopicSummary[] }>({
    queryKey: ["my-learning-topics"],
    queryFn: () =>
      fetch("/api/my-learning/topics").then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    staleTime: 60_000,
    enabled,
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load your topics");
  }, [isError]);

  async function handleSubmit(value: string) {
    const trimmed = value.trim();
    if (!trimmed || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/my-learning/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const { topicId } = await res.json();
      router.push(`/my-learning/${topicId}`);
    } catch {
      toast.error("Failed to generate topic. Please try again.");
      setIsGenerating(false);
    }
  }

  const topics = data?.topics ?? [];

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* Left sidebar */}
      <aside className="relative z-10 w-64 shrink-0 border-r border-border/50 flex flex-col py-6 px-3 overflow-y-auto bg-background/60 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-6 px-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-foreground/80">
            Explored
          </span>
        </div>

        {topics.length === 0 ? (
          <div className="px-2 py-4 text-center">
            <div className="text-2xl mb-2">📚</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Topics you explore will appear here.
            </p>
          </div>
        ) : (
          <motion.nav
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-1"
          >
            {topics.map((t) => (
              <motion.div key={t.id} variants={item}>
                <Link href={`/my-learning/${t.id}`}>
                  <div className="group relative rounded-xl px-3 py-2.5 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all duration-200 cursor-pointer overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-0.5 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-top rounded-r" />
                    <p className="text-sm font-medium leading-snug line-clamp-2 text-foreground/80 group-hover:text-foreground transition-colors pl-1">
                      {t.title}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1 pl-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(t.createdAt)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.nav>
        )}
      </aside>

      {/* Main content */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl px-6 py-14">

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-10 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full bg-athena-amber/10 dark:bg-athena-amber/20 border border-athena-amber/30 px-4 py-1.5 text-xs font-bold text-athena-amber mb-5"
            >
              <Sparkles className="h-3.5 w-3.5 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
              Powered by Athena AI
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="text-4xl sm:text-5xl font-black tracking-tighter mb-3 text-foreground"
            >
              Learn{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-athena-amber">
                anything
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed"
            >
              Type any topic and Athena will build you a personalised lesson, quiz, and micro-lesson in seconds.
            </motion.p>
          </motion.div>

          {/* Search box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="relative mb-4"
          >
            <div className={`relative transition-all duration-300 ${isFocused ? "drop-shadow-[0_0_20px_rgba(var(--primary),0.25)]" : "drop-shadow-none"}`}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <input
                placeholder="e.g. Photosynthesis, World War II, Python basics…"
                value={topic}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") handleSubmit(topic);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isGenerating}
                className="w-full rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm pl-11 pr-36 py-4 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 disabled:opacity-50 transition-all text-foreground"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Button
                  onClick={() => handleSubmit(topic)}
                  disabled={isGenerating || !topic.trim()}
                  size="sm"
                  className="rounded-xl px-4 gap-1.5 font-bold"
                >
                  {isGenerating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                      </motion.div>
                      Generating…
                    </>
                  ) : (
                    <>
                      Explore
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Generating state */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="flex items-center gap-3 rounded-2xl border border-athena-amber/30 bg-athena-amber/5 dark:bg-athena-amber/10 px-4 py-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="h-4 w-4 text-athena-amber drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]" />
                  </motion.div>
                  <div>
                    <span className="text-sm font-bold text-foreground">Athena is preparing your lesson…</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Building quiz, micro-lesson, and content</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Suggested topics */}
          <AnimatePresence>
            {!isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  ✦ Suggested topics
                </p>
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="flex flex-wrap gap-2"
                >
                  {SUGGESTED_TOPICS.map((t) => (
                    <motion.button
                      key={t}
                      variants={{
                        hidden: { opacity: 0, scale: 0.9 },
                        show: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
                      }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSubmit(t)}
                      className="rounded-full border border-border/60 bg-card/60 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-foreground/80 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground hover:shadow-[0_0_10px_rgba(var(--primary),0.15)] transition-all duration-200"
                    >
                      {t}
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

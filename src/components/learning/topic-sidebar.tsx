"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getTopicIcon } from "@/lib/topic-icons";

type Topic = {
  slug: string;
  name: string;
  subject: string;
};

const SUBJECT_LABELS: Record<string, string> = {
  math: "Math",
  "reading-writing": "Reading & Writing",
};

export function TopicSidebar({
  topics,
  activeSlug,
}: {
  topics: Topic[];
  activeSlug: string;
}) {
  const subjects = [...new Set(topics.map((t) => t.subject))];

  return (
    <nav className="w-64 shrink-0 space-y-8 pr-4 border-r border-white/5">
      {subjects.map((subject) => (
        <div key={subject} className="space-y-3">
          <div className="flex items-center gap-2 px-3">
             <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
               {SUBJECT_LABELS[subject] ?? subject}
             </p>
          </div>
          <div className="space-y-1.5">
            {topics
              .filter((t) => t.subject === subject)
              .map((topic) => {
                const isActive = topic.slug === activeSlug;
                const Icon = getTopicIcon(topic.slug);
                return (
                  <Link
                    key={topic.slug}
                    href={`/learning/${topic.slug}`}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition-all duration-300",
                      isActive
                        ? "bg-primary/20 text-primary shadow-[0_0_20px_rgba(var(--primary),0.1)] ring-1 ring-primary/30"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute left-0 w-1 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.8)]"
                      />
                    )}
                    <Icon className={cn(
                      "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="truncate tracking-wide">{topic.name}</span>
                  </Link>
                );
              })}
          </div>
        </div>
      ))}
    </nav>
  );
}

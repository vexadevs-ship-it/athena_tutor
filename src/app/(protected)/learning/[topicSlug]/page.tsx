"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { motion, type Variants } from "framer-motion";
import { TopicSidebar } from "@/components/learning/topic-sidebar";
import { TopicHeader } from "@/components/learning/topic-header";
import { SubtopicCard } from "@/components/learning/subtopic-card";
import { Sparkles } from "lucide-react";

type Subtopic = {
  id: string;
  slug: string;
  name: string;
  difficulty: string;
  estimatedMinutes: number;
  description: string;
};

type Topic = {
  id: string;
  slug: string;
  name: string;
  subject: string;
  overview: string;
  estimatedTotalMinutes: number;
  satRelevance: { percentageOfTest: number; description: string };
  difficultyDistribution: { easy: number; medium: number; hard: number };
  subtopics: Subtopic[];
};

const cardStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function TopicPage() {
  const params = useParams<{ topicSlug: string }>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/learning");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setTopics(data.topics);
      } catch {
        toast.error("Failed to load learning data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeTopic = topics.find((t) => t.slug === params.topicSlug) ?? topics[0];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="relative z-10 mx-auto max-w-5xl p-6">
          <div className="mb-6 h-8 w-48 bg-muted/60 rounded-xl animate-pulse" />
          <div className="flex gap-6">
            <div className="w-56 shrink-0 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-muted/40 rounded-xl animate-pulse border border-border/30" />
              ))}
            </div>
            <div className="flex-1 space-y-4">
              <div className="h-32 bg-muted/40 rounded-2xl animate-pulse border border-border/30" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-muted/40 rounded-2xl animate-pulse border border-border/30" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeTopic) return null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="relative z-10 mx-auto max-w-5xl p-6">

        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6 flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4 text-athena-amber drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]" />
          <h1 className="text-lg font-black tracking-tight text-foreground">Learning Arsenal</h1>
        </motion.div>

        <div className="flex gap-6">
          <TopicSidebar topics={topics} activeSlug={activeTopic.slug} />

          <div className="flex-1 min-w-0 space-y-6">
            <TopicHeader topic={activeTopic} />

            {activeTopic.subtopics.length > 0 ? (
              <motion.div
                variants={cardStagger}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              >
                {activeTopic.subtopics.map((st) => (
                  <motion.div key={st.id} variants={cardItem}>
                    <SubtopicCard subtopic={st} topicSlug={activeTopic.slug} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-16 text-center gap-3"
              >
                <Sparkles className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  No subtopics available for this topic yet.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

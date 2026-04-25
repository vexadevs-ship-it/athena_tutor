"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { QuizLayoutProvider } from "@/components/learning/quiz/quiz-layout-provider";
import type { Problem } from "@/components/quiz/types";

type PageData = {
  topic: { slug: string; name: string };
  subtopic: { id: string; slug: string; name: string };
  problems: unknown[];
};

type RawProblem = Record<string, unknown>;

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v ?? "")).filter(Boolean);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v ?? "")).filter(Boolean);
    } catch {
      // fall through to delimiter split
    }
    return trimmed.split(/\n|\|/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function normalizeProblem(raw: RawProblem, index: number): Problem {
  const options = toStringArray(raw.options ?? raw.choices ?? raw.answer_choices ?? raw.answers);
  const questionText = String(
    raw.questionText ??
    raw.question_text ??
    raw.question ??
    raw.prompt ??
    raw.stem ??
    ""
  );
  const correctOptionRaw = raw.correctOption ?? raw.correct_option ?? raw.answerIndex ?? raw.correct_index ?? 0;
  const correctOption = Number.isFinite(Number(correctOptionRaw)) ? Number(correctOptionRaw) : 0;

  return {
    id: String(raw.id ?? `problem-${index + 1}`),
    orderIndex: Number(raw.orderIndex ?? raw.order_index ?? index),
    difficulty: String(raw.difficulty ?? raw.difficulty_level ?? "medium"),
    questionText,
    options,
    correctOption: Math.max(0, Math.min(options.length - 1, correctOption)),
    explanation: String(raw.explanation ?? raw.rationale ?? ""),
    solutionSteps: Array.isArray(raw.solutionSteps ?? raw.solution_steps) ? ((raw.solutionSteps ?? raw.solution_steps) as Problem["solutionSteps"]) : [],
    hint: String(raw.hint ?? ""),
    detailedHint: (raw.detailedHint ?? raw.detailed_hint ?? undefined) as string | undefined,
    timeRecommendationSeconds: Number(raw.timeRecommendationSeconds ?? raw.time_recommendation_seconds ?? 60),
  };
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ topicSlug: string; subtopicSlug: string }>();
  const router = useRouter();

  const { data, isLoading, isError } = useQuery<PageData>({
    queryKey: ["learning", params.topicSlug, params.subtopicSlug],
    queryFn: () =>
      fetch(`/api/learning/${params.topicSlug}/${params.subtopicSlug}`).then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    staleTime: 600_000,
  });

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load quiz");
      router.push(`/learning/${params.topicSlug}/${params.subtopicSlug}`);
    }
  }, [isError, router, params.topicSlug, params.subtopicSlug]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  const normalizedProblems = (data.problems ?? []).map((p, i) => normalizeProblem((p ?? {}) as RawProblem, i));

  const subtopicId = data.subtopic.id;

  return (
    <QuizLayoutProvider
      problems={normalizedProblems}
      topicName={data.topic.name}
      subtopicName={data.subtopic.name}
      subject="math"
      basePath={`/learning/${params.topicSlug}/${params.subtopicSlug}`}
      practiceProblemsUrl={`/api/learning/${params.topicSlug}/${params.subtopicSlug}/practice-problems`}
      onSaveResults={async ({ score, totalQuestions, timeElapsedSeconds, answers, events }) => {
        const res = await fetch("/api/sat-quiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subtopicId,
            score,
            totalQuestions,
            timeElapsedSeconds,
            answers,
            events,
          }),
        });
        if (!res.ok) throw new Error("Failed to save results");
      }}
    >
      {children}
    </QuizLayoutProvider>
  );
}

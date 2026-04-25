"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useMyLearningTopic } from "@/hooks/use-my-learning-topic";
import { QuizLayoutProvider } from "@/components/learning/quiz/quiz-layout-provider";
import type { Problem } from "@/components/quiz/types";

type RawQuestion = Record<string, unknown>;

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

function normalizeQuestion(raw: RawQuestion, index: number): Problem {
  const options = toStringArray(raw.options ?? raw.choices ?? raw.answer_choices ?? raw.answers);
  const questionText = String(
    raw.questionText ??
      raw.question_text ??
      raw.question ??
      raw.prompt ??
      raw.stem ??
      ""
  );
  const correctOptionRaw =
    raw.correctOption ?? raw.correct_option ?? raw.answerIndex ?? raw.correct_index ?? 0;
  const correctOption = Number.isFinite(Number(correctOptionRaw)) ? Number(correctOptionRaw) : 0;

  return {
    id: String(raw.id ?? `custom-problem-${index + 1}`),
    orderIndex: Number(raw.orderIndex ?? raw.order_index ?? index),
    difficulty: String(raw.difficulty ?? raw.difficulty_level ?? "medium"),
    questionText,
    options,
    correctOption: Math.max(0, Math.min(options.length - 1, correctOption)),
    explanation: String(raw.explanation ?? raw.rationale ?? ""),
    solutionSteps: Array.isArray(raw.solutionSteps ?? raw.solution_steps)
      ? ((raw.solutionSteps ?? raw.solution_steps) as Problem["solutionSteps"])
      : [],
    hint: String(raw.hint ?? ""),
    detailedHint: (raw.detailedHint ?? raw.detailed_hint ?? undefined) as string | undefined,
    timeRecommendationSeconds: Number(
      raw.timeRecommendationSeconds ?? raw.time_recommendation_seconds ?? 60
    ),
  };
}

function questionsToProblems(questions: unknown[]): Problem[] {
  return (questions ?? [])
    .map((q, i) => normalizeQuestion((q ?? {}) as RawQuestion, i))
    .filter((q) => q.questionText.trim().length > 0 && q.options.length > 0);
}

export default function MyLearningQuizLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ topicId: string }>();
  const router = useRouter();

  const { data, isLoading, isError } = useMyLearningTopic(params.topicId);

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load quiz");
      router.push(`/my-learning/${params.topicId}`);
    }
  }, [isError, router, params.topicId]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  const { topic, questions } = data;
  const problems = questionsToProblems(questions);
  const topicId = params.topicId;

  return (
    <QuizLayoutProvider
      problems={problems}
      topicName={topic.title}
      subtopicName={topic.title}
      subject="math"
      basePath={`/my-learning/${topicId}`}
      practiceProblemsUrl={`/api/my-learning/topics/${topicId}/practice-problems`}
      onSaveResults={async ({ score, totalQuestions, timeElapsedSeconds, answers, events }) => {
        const res = await fetch("/api/my-learning/quiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId,
            score,
            totalQuestions,
            timeElapsedSeconds,
            answers: answers.map((a) => ({
              questionId: a.problemId,
              selectedOption: a.selectedOption,
              isCorrect: a.isCorrect,
              responseTimeMs: a.responseTimeMs,
              wrongCount: a.wrongCount,
              hintUsed: a.hintUsed,
              tutorUsed: a.tutorUsed,
              practiceCompleted: a.practiceCompleted,
            })),
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

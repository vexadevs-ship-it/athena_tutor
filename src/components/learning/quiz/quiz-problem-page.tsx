"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useQuizRouteContext } from "@/components/learning/quiz/quiz-route-context";
import { Toolbar } from "@/components/quiz/toolbar";
import { SegmentProgressBar } from "@/components/quiz/segment-progress-bar";
import { QuestionPanel } from "@/components/quiz/question-panel";
import { AnswerPanel } from "@/components/quiz/answer-panel";
import { BottomBar } from "@/components/quiz/bottom-bar";
import { Calculator } from "@/components/quiz/calculator";
import { ResultsScreen } from "@/components/quiz/results-screen";
import { PostLessonPractice } from "@/components/learning/post-lesson-practice";
import { StuckModal } from "@/components/quiz/stuck-modal";
import { Flame, Zap } from "lucide-react";

export function QuizProblemPageContent() {
  const router = useRouter();
  const params = useParams<{ problemNumber: string }>();
  const problemNum = Math.max(1, parseInt(params.problemNumber, 10) || 1);
  const {
    problems,
    topicName,
    subtopicName,
    subject,
    basePath,
    quiz,
    timer,
    feedbackMap,
    lockedIds,
    direction,
    setSaveStatus,
    setFeedbackMap,
    setLockedIds,
    handleSelectAnswer,
    stuckModalShownIds,
    markStuckModalShown,
  } = useQuizRouteContext();

  const [calcOpen, setCalcOpen] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  const [showStuckModal, setShowStuckModal] = useState(false);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const processedFeedback = useRef<Set<string>>(new Set());

  const { mutate: fetchSummary, data: aiSummary } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/lesson-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicName,
          subtopicName,
          lessonType: "quiz",
          score: { correct: quiz.score, total: problems.length },
        }),
      });
      if (!res.ok) throw new Error("Failed to generate summary");
      return res.json() as Promise<{
        greeting: string;
        summary: string;
        encouragement: string;
      }>;
    },
  });

  const quizBase = `${basePath}/quiz`;

  // On first mount: sync quiz state to the URL param (handles refresh / direct navigation).
  // On subsequent index changes: sync URL to quiz state (handles advancing questions).
  const syncedRef = useRef(false);
  useEffect(() => {
    if (!syncedRef.current) {
      syncedRef.current = true;
      const targetIndex = problemNum - 1;
      if (targetIndex !== quiz.currentIndex && targetIndex >= 0 && targetIndex < problems.length) {
        quiz.goTo(targetIndex);
      }
      return;
    }
    router.push(`${quizBase}/${quiz.currentIndex + 1}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.currentIndex]);

  const currentProblem = problems[quiz.currentIndex];
  const questionPhase = currentProblem ? quiz.getQuestionPhase(currentProblem.id) : "question";
  const hasCorrectAnswer =
    currentProblem && quiz.answers.get(currentProblem.id) === currentProblem.correctOption;
  const canAdvance = questionPhase === "question" && !!hasCorrectAnswer;

  // Fetch AI summary when quiz is submitted
  const summaryFetchedRef = useRef(false);
  useEffect(() => {
    if (quiz.phase === "submitted" && !summaryFetchedRef.current) {
      summaryFetchedRef.current = true;
      fetchSummary();
    }
  }, [quiz.phase, fetchSummary]);

  // Show stuck modal when question enters tutor phase (only once per problem)
  useEffect(() => {
    if (questionPhase === "tutor" && currentProblem && !stuckModalShownIds.has(currentProblem.id)) {
      setShowStuckModal(true);
    }
  }, [questionPhase, currentProblem, stuckModalShownIds]);

  useEffect(() => {
    for (const [problemId, feedback] of feedbackMap.entries()) {
      if (processedFeedback.current.has(problemId)) continue;
      processedFeedback.current.add(problemId);
      if (feedback.type === "correct") {
        setCombo((prev) => {
          const next = prev + 1;
          setBestCombo((best) => Math.max(best, next));
          return next;
        });
      } else {
        setCombo(0);
      }
    }
  }, [feedbackMap]);

  const handleStuckModalComplete = useCallback(() => {
    if (currentProblem) markStuckModalShown(currentProblem.id);
    setShowStuckModal(false);
    router.push(`${quizBase}/${quiz.currentIndex + 1}/tutor`);
  }, [router, quizBase, quiz.currentIndex, currentProblem, markStuckModalShown]);

  if (problems.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-lg rounded-2xl border border-athena-amber/30 bg-card/80 p-6 text-center backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-widest text-athena-amber">No Quiz Questions Loaded</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We could not load SAT problems for this subtopic yet. Return to review and try again.
          </p>
          <button
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            onClick={() => router.push(basePath)}
          >
            Back to Subtopic
          </button>
        </div>
      </div>
    );
  }

  if (!currentProblem) return null;

  if (quiz.phase === "submitted") {
    if (showPractice) {
      return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <PostLessonPractice
            topic={topicName}
            subtopic={subtopicName}
            subject={subject ?? "math"}
            onComplete={() => {
              setShowPractice(false);
              setPracticeCompleted(true);
            }}
          />
        </div>
      );
    }
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <ResultsScreen
          problems={problems}
          answers={quiz.answers}
          score={quiz.score}
          elapsed={timer.elapsed}
          aiSummary={aiSummary}
          onRetry={() => {
            setSaveStatus("idle");
            setFeedbackMap(new Map());
            setLockedIds(new Set());
            setShowPractice(false);
            setPracticeCompleted(false);
            quiz.restart();
            router.push(`${quizBase}/1`);
          }}
          onClose={
            practiceCompleted
              ? () => router.push(basePath)
              : undefined
          }
          onPractice={practiceCompleted ? undefined : () => setShowPractice(true)}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <Toolbar
        displayTime={timer.displayTime}
        isLow={timer.isLow}
        timerHidden={timer.hidden}
        onToggleTimer={timer.toggleHidden}
        calcOpen={calcOpen}
        onToggleCalc={() => setCalcOpen((o) => !o)}
        onClose={() => router.push(basePath)}
        hasAnswers={quiz.answers.size > 0}
        subtopicName={subtopicName}
      />
      <SegmentProgressBar
        total={problems.length}
        currentIndex={quiz.currentIndex}
        getStatus={quiz.getQuestionStatus}
        onNavigate={() => {}}
      />
      <div className="flex items-center justify-between border-b border-white/10 bg-card/45 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 text-athena-amber">
          <Flame className="h-3.5 w-3.5" />
          <span className="font-bold uppercase tracking-widest">Combo {combo}</span>
          <span className="text-muted-foreground">Best {bestCombo}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-28 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-athena-amber to-emerald-400"
              animate={{ width: `${Math.min(100, combo * 20)}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            <Zap className="h-3 w-3" />
            Momentum
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-full flex-col md:flex-row md:divide-x">
          <QuestionPanel
            problem={currentProblem}
            questionNumber={quiz.currentIndex + 1}
          />
          <AnswerPanel
            problem={currentProblem}
            questionNumber={quiz.currentIndex + 1}
            selectedOption={quiz.answers.get(currentProblem.id)}
            isMarked={quiz.markedIds.has(currentProblem.id)}
            onSelect={(i) => handleSelectAnswer(currentProblem.id, i)}
            onToggleMark={() => quiz.toggleMark(currentProblem.id)}
            direction={direction}
            feedbackState={feedbackMap.get(currentProblem.id)}
            disabled={lockedIds.has(currentProblem.id)}
          >
            {questionPhase === "hint" && currentProblem.hint && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-lg border border-athena-amber/40 bg-athena-amber/10 px-4 py-3"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-athena-amber mb-1">
                  Hint
                </p>
                <p className="text-sm text-muted-foreground">{currentProblem.hint}</p>
              </motion.div>
            )}
          </AnswerPanel>
        </div>
      </div>

      <BottomBar
        currentIndex={quiz.currentIndex}
        total={problems.length}
        unansweredCount={quiz.unansweredCount}
        onBack={quiz.goBack}
        onNext={quiz.goNext}
        onGoTo={quiz.goTo}
        onSubmit={quiz.submit}
        getStatus={quiz.getQuestionStatus}
        sequential={true}
        nextDisabled={!canAdvance}
      />

      <AnimatePresence>
        {calcOpen && quiz.phase === "active" && <Calculator />}
      </AnimatePresence>

      <AnimatePresence>
        {showStuckModal && (
          <StuckModal onComplete={handleStuckModalComplete} />
        )}
      </AnimatePresence>
    </div>
  );
}

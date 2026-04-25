"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useQuestContext } from "./quest-context";
import { Toolbar } from "@/components/quiz/toolbar";
import { SegmentProgressBar } from "@/components/quiz/segment-progress-bar";
import { QuestionPanel } from "@/components/quiz/question-panel";
import { AnswerPanel } from "@/components/quiz/answer-panel";
import { BottomBar } from "@/components/quiz/bottom-bar";
import { Calculator } from "@/components/quiz/calculator";
import { StuckModal } from "@/components/quiz/stuck-modal";
import { QuestResultsScreen } from "./quest-results-screen";
import { MathContent } from "@/components/quiz/math-content";
import { Swords, Wand2, Shield } from "lucide-react";

export function QuestProblemPageContent() {
  const router = useRouter();
  const params = useParams<{ problemNumber: string }>();
  const problemNum = Math.max(1, parseInt(params.problemNumber, 10) || 1);
  const ctx = useQuestContext();

  const [calcOpen, setCalcOpen] = useState(false);
  const [showStuckModal, setShowStuckModal] = useState(false);

  // Sync URL <-> currentIndex
  const syncedRef = useRef(false);
  useEffect(() => {
    if (!syncedRef.current) {
      syncedRef.current = true;
      const targetIndex = problemNum - 1;
      if (targetIndex !== ctx.currentIndex && targetIndex >= 0 && targetIndex < ctx.problems.length) {
        ctx.goTo(targetIndex);
      }
      return;
    }
    router.push(`/quest/${ctx.currentIndex + 1}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.currentIndex]);

  const currentProblem = ctx.problems[ctx.currentIndex];
  const questionPhase = currentProblem ? ctx.getQuestionPhase(currentProblem.id) : "question";

  // Show stuck modal when question enters tutor phase (only once per problem)
  useEffect(() => {
    if (questionPhase === "tutor" && currentProblem && !ctx.stuckModalShownIds.has(currentProblem.id)) {
      setShowStuckModal(true);
    }
  }, [questionPhase, currentProblem, ctx.stuckModalShownIds]);

  const handleStuckModalComplete = useCallback(() => {
    if (currentProblem) ctx.markStuckModalShown(currentProblem.id);
    setShowStuckModal(false);
    router.push(`/quest/${ctx.currentIndex + 1}/tutor`);
  }, [router, ctx, currentProblem]);

  if (!currentProblem) return null;

  const isLocked = ctx.lockedIds.has(currentProblem.id) || currentProblem.isCorrect === true;

  // Convert quest problem to quiz Problem shape for reused components
  const asProblem = {
    id: currentProblem.id,
    orderIndex: currentProblem.orderIndex,
    difficulty: `Level ${currentProblem.difficultyLevel}`,
    questionText: currentProblem.questionText,
    options: currentProblem.options,
    correctOption: currentProblem.correctOption,
    explanation: currentProblem.explanation,
    solutionSteps: currentProblem.solutionSteps.map((s) => ({
      step: s.step,
      instruction: s.instruction,
      math: s.math ?? "",
    })),
    hint: currentProblem.hint,
    detailedHint: currentProblem.detailedHint,
    timeRecommendationSeconds: 90,
  };

  if (ctx.phase === "completed") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <QuestResultsScreen />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      <div className="relative z-10 flex flex-col h-full">
        <Toolbar
          displayTime={ctx.displayTime}
          isLow={ctx.isTimerLow}
          timerHidden={ctx.timerHidden}
          onToggleTimer={ctx.toggleTimerHidden}
          calcOpen={calcOpen}
          onToggleCalc={() => setCalcOpen((o) => !o)}
          onClose={() => router.push("/dashboard")}
          hasAnswers={ctx.answers.size > 0}
          subtopicName={currentProblem.subtopicName}
        />
      <SegmentProgressBar
        total={ctx.problems.length}
        currentIndex={ctx.currentIndex}
        getStatus={ctx.getQuestionStatus}
        onNavigate={() => {}}
      />

        {/* Subtopic badge */}
        <div className="flex items-center gap-3 px-6 py-2 border-b border-white/5 bg-white/5 backdrop-blur-md">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-athena-amber/20 border border-athena-amber/30">
             <Swords className="h-3 w-3 text-athena-amber" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
              {currentProblem.topicName}
            </span>
            <span className="text-[10px] text-muted-foreground/30">/</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-athena-amber">
              {currentProblem.subtopicName}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-athena-amber animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Difficulty: {currentProblem.difficultyLevel}
            </span>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex w-full flex-col md:flex-row md:divide-x md:divide-white/5">
            <div className="flex-1 overflow-hidden bg-black/20 backdrop-blur-sm">
              <QuestionPanel
                problem={asProblem}
                questionNumber={ctx.currentIndex + 1}
              />
            </div>
            <div className="flex-1 overflow-hidden bg-black/40 backdrop-blur-md">
              <AnswerPanel
                problem={asProblem}
                questionNumber={ctx.currentIndex + 1}
                selectedOption={
                  ctx.answers.get(currentProblem.id) ??
                  (currentProblem.selectedOption ?? undefined)
                }
                isMarked={false}
                onSelect={(i) => ctx.handleSelectAnswer(currentProblem.id, i)}
                onToggleMark={() => {}}
                direction={ctx.direction}
                feedbackState={ctx.feedbackMap.get(currentProblem.id)}
                disabled={isLocked}
              >
                {/* Hint (1st wrong) */}
                {(questionPhase === "hint" || questionPhase === "hint2" || questionPhase === "tutor") && currentProblem.hint && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 rounded-xl border border-athena-amber/30 bg-athena-amber/10 p-4 shadow-[0_0_20px_rgba(251,191,36,0.05)]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Wand2 className="h-3.5 w-3.5 text-athena-amber" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-athena-amber">
                        Tutor&apos;s Hint
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed italic">
                      <MathContent content={currentProblem.hint} />
                    </div>
                  </motion.div>
                )}

                {/* Stronger hint (2nd wrong) */}
                {(questionPhase === "hint2" || questionPhase === "tutor") && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 shadow-[0_0_20px_rgba(59,130,246,0.05)]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-3.5 w-3.5 text-blue-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                        Battle Strategy
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed italic">
                      <MathContent
                        content={
                          currentProblem.detailedHint ||
                          (currentProblem.solutionSteps.length > 0
                            ? `Try this approach: ${currentProblem.solutionSteps[0].instruction}`
                            : currentProblem.explanation.slice(0, 200) +
                              (currentProblem.explanation.length > 200 ? "..." : ""))
                        }
                      />
                    </div>
                  </motion.div>
                )}
              </AnswerPanel>
            </div>
          </div>
        </div>
      </div>

      <BottomBar
        currentIndex={ctx.currentIndex}
        total={ctx.problems.length}
        unansweredCount={ctx.problems.length - ctx.lockedIds.size}
        onBack={ctx.goBack}
        onNext={ctx.goNext}
        onGoTo={ctx.goTo}
        onSubmit={ctx.handleComplete}
        getStatus={ctx.getQuestionStatus}
        sequential={false}
        nextDisabled={false}
      />

      <AnimatePresence>
        {calcOpen && ctx.phase === "active" && <Calculator />}
      </AnimatePresence>

      <AnimatePresence>
        {showStuckModal && (
          <StuckModal onComplete={handleStuckModalComplete} />
        )}
      </AnimatePresence>
    </div>
  );
}

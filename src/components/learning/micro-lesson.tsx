"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import type { WhiteboardStep, CheckInAction, PredictAction, FillBlankAction } from "@/types/whiteboard";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sparkles, ChevronLeft, BookOpen, ChevronRight, Check, X,
  Send, Mic, Keyboard, CheckCircle, Trophy, Swords, Zap, Wand2, Shield, AlertTriangle
} from "lucide-react";
import { useMicroLesson } from "@/hooks/use-micro-lesson";
import { useLessonChat } from "@/hooks/use-lesson-chat";
import { WhiteboardCanvas } from "@/components/whiteboard/whiteboard-canvas";
import { WbCoordinatePlane } from "@/components/whiteboard/elements/wb-coordinate-plane";
import { WbGeometry } from "@/components/whiteboard/elements/wb-geometry";
import type { CoordinatePlaneAction, GeometryAction } from "@/types/whiteboard";
import { useStepPlayer } from "@/hooks/use-step-player";
import { MessageBubble } from "@/components/lessons/message-bubble";
import { ThinkingIndicator } from "@/components/lessons/thinking-indicator";
import { VoiceOrb } from "@/components/lessons/voice-orb";
import PixelCharacter from "@/components/shared/PixelCharacter";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSound } from "@/hooks/useSound";
import { MathContent } from "@/components/quiz/math-content";
import { PracticeGradientCard } from "@/components/quiz/practice-gradient-card";
import type { Problem } from "@/components/quiz/types";
import { WhiteboardSkeleton } from "@/components/whiteboard/whiteboard-skeleton";
import { GenerationProgress } from "@/components/lessons/generation-progress";
import { WhyThisMattersModal } from "@/components/learning/why-this-matters-modal";
import { InteractiveGraphSystem } from "@/components/learning/interactive-graph-system";
import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";

type MicroLessonProps = {
  topic: string;
  subtopic: string;
  metadata: {
    description?: string;
    learningObjectives?: string[];
    keyFormulas?: { latex: string; description: string }[];
    commonMistakes?: { mistake: string; correction: string; why: string }[];
    tipsAndTricks?: string[];
    conceptualOverview?: {
      definition: string;
      realWorldExample: string;
      satContext: string;
    };
  };
  onClose: () => void;
  practiceProblems?: Problem[];
  streamUrl?: string;
  chatStreamUrl?: string;
  existingLesson?: { lessonContent: string; whiteboardSteps: WhiteboardStep[] } | null;
  subtopicApiPath?: string;
  practiceMode?: {
    subject?: "math" | "reading-writing";
    quizStreamUrl?: string;
  };
  tracking?: {
    microLessonId: string;
    subtopicId: string;
  };
};

const CONFETTI_COLORS = [
  "hsl(var(--green))",
  "hsl(var(--blue))",
  "hsl(var(--yellow))",
  "hsl(var(--pink))",
  "hsl(var(--orange))",
];

function CheckInConfetti() {
  const particles = useMemo(
    () => Array.from({ length: 14 }, (_, i) => {
      const r1 = ((i * 37) % 100) / 100;
      const r2 = ((i * 59 + 13) % 100) / 100;
      const r3 = ((i * 83 + 7) % 100) / 100;
      return {
        id: i,
        x: r1 * 100,
        delay: r2 * 0.4,
        size: 3 + r3 * 3,
        driftY: -180 - r1 * 120,
        driftX: (r2 - 0.5) * 80,
        duration: 1.2 + r3 * 0.4,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      };
    }),
    [],
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: "30%",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ y: 0, opacity: 1 }}
          animate={{
            y: p.driftY,
            opacity: [1, 1, 0],
            x: p.driftX,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

function CheckInCard({
  checkIn,
  onAnswer,
  onNarrate,
  onHintPhase,
  onResult,
}: {
  checkIn: CheckInAction;
  onAnswer: () => void;
  onNarrate?: (text: string) => void;
  onHintPhase?: (phase: "none" | "hinted" | "detailed") => void;
  onResult?: (correct: boolean) => void;
}) {
  const [phase, setPhase] = useState<"answering" | "hinted" | "detailed" | "revealed">("answering");
  const [selected, setSelected] = useState<number | null>(null);
  const [wrongIndices, setWrongIndices] = useState<Set<number>>(new Set());
  const sound = useSound();

  const isCorrect = selected === checkIn.correctOption;
  const isRevealed = phase === "revealed";

  const handleSelect = (index: number) => {
    if (isRevealed) return;
    if (wrongIndices.has(index)) return;

    setSelected(index);

    if (index === checkIn.correctOption) {
      sound.achievement();
      setPhase("revealed");
      onResult?.(true);
      onNarrate?.("Correct! Let's move on.");
      return;
    }

    sound.wrong();
    onResult?.(false);
    const next = new Set(wrongIndices);
    next.add(index);
    setWrongIndices(next);

    if (phase === "answering" && checkIn.hint) {
      setPhase("hinted");
      onHintPhase?.("hinted");
      onNarrate?.(checkIn.hint);
    } else if (phase === "hinted" && checkIn.detailedHint) {
      setPhase("detailed");
      onHintPhase?.("detailed");
      onNarrate?.(checkIn.detailedHint);
    } else {
      setPhase("revealed");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative space-y-4 rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md shadow-xl"
    >
      {isRevealed && isCorrect && <CheckInConfetti />}
      
      <div className="flex items-center gap-2 mb-2">
         <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-athena-amber/20 border border-athena-amber/30">
            <Swords className="h-3.5 w-3.5 text-athena-amber" />
         </div>
         <span className="text-[10px] font-black uppercase tracking-widest text-athena-amber">Battle Check-In</span>
      </div>

      <div className="text-sm font-bold text-foreground leading-relaxed">
        <MathContent content={checkIn.question} />
      </div>

      <div className="grid gap-2">
        {checkIn.options.map((option, i) => {
          const isThis = selected === i;
          const isRight = i === checkIn.correctOption;
          const isWrong = wrongIndices.has(i);
          return (
            <motion.button
              key={i}
              whileHover={!isRevealed && !isWrong ? { scale: 1.02, x: 4 } : {}}
              whileTap={!isRevealed && !isWrong ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(i)}
              disabled={isRevealed || isWrong}
              className={cn(
                "group flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-300",
                !isRevealed && !isWrong && "border-white/5 bg-white/5 hover:border-athena-amber/30 hover:bg-athena-amber/5 cursor-pointer",
                isRevealed && isRight && "border-green-500/50 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.15)]",
                isRevealed && isThis && !isRight && "border-red-500/50 bg-red-500/10",
                isRevealed && !isThis && !isRight && "opacity-40 grayscale",
                isWrong && !isRevealed && "border-red-500/30 bg-red-500/5 opacity-60 grayscale cursor-not-allowed",
              )}
            >
              <span className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[10px] font-black transition-colors",
                isRevealed && isRight ? "border-green-500 bg-green-500 text-white" : 
                (isRevealed && isThis && !isRight) || isWrong ? "border-red-500 bg-red-500 text-white" :
                "border-white/20 bg-black/20 text-muted-foreground group-hover:border-athena-amber/40 group-hover:text-athena-amber"
              )}>
                {isRevealed && isRight ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (isRevealed && isThis && !isRight) || isWrong ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </span>
              <span className="font-medium flex-1">
                <MathContent content={option} />
              </span>
            </motion.button>
          );
        })}
      </div>

      {(phase === "hinted" || phase === "detailed") && checkIn.hint && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-athena-amber/30 bg-athena-amber/10 p-3 shadow-[0_0_20px_rgba(251,191,36,0.05)]"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Wand2 className="h-3.5 w-3.5 text-athena-amber" />
            <p className="text-[10px] font-black uppercase tracking-widest text-athena-amber">
              Tutor&apos;s Guidance
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed italic">
             &ldquo;{checkIn.hint}&rdquo;
          </p>
        </motion.div>
      )}

      {phase === "detailed" && checkIn.detailedHint && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 shadow-[0_0_20px_rgba(59,130,246,0.05)]"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Shield className="h-3.5 w-3.5 text-blue-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              Battle Strategy
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed italic">
             &ldquo;{checkIn.detailedHint}&rdquo;
          </p>
        </motion.div>
      )}

      {isRevealed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="pt-2 space-y-3"
        >
          <div className="h-px bg-white/5 w-full" />
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
               <AlertTriangle className="h-3 w-3 text-muted-foreground" />
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">The Insight</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{checkIn.explanation}</p>
          </div>
          <Button 
            size="sm" 
            className="w-full gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-[0_4px_15px_rgba(var(--primary),0.3)] transition-all" 
            onClick={onAnswer}
          >
            {isCorrect ? "Onward to Victory" : "Accept and Continue"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Predict question UI ──────────────────────────────────────────────

function PredictCard({
  predict,
  onAnswer,
  onNarrate,
  onHintPhase,
  onResult,
}: {
  predict: PredictAction;
  onAnswer: () => void;
  onNarrate?: (text: string) => void;
  onHintPhase?: (phase: "none" | "hinted" | "detailed") => void;
  onResult?: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [wrongIndices, setWrongIndices] = useState<Set<number>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const answeredRef = useRef(false);
  const sound = useSound();

  const isCorrect = selected === predict.correctOption;

  const handleSelect = (index: number) => {
    if (revealed || wrongIndices.has(index)) return;
    setSelected(index);

    if (index === predict.correctOption) {
      sound.achievement();
      setRevealed(true);
      onResult?.(true);
      onNarrate?.("Correct! Let's move on.");
      return;
    }

    sound.wrong();
    onResult?.(false);
    const next = new Set(wrongIndices);
    next.add(index);
    setWrongIndices(next);

    if (predict.hint && !showHint) {
      setShowHint(true);
      onHintPhase?.("hinted");
      onNarrate?.(predict.hint);
    }

    const wrongCount = next.size;
    if (wrongCount >= predict.options.length - 1) {
      setSelected(predict.correctOption);
      setRevealed(true);
    }
  };

  useEffect(() => {
    if (revealed && !answeredRef.current) {
      answeredRef.current = true;
      onAnswer();
    }
  }, [revealed, onAnswer]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative space-y-4 rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md shadow-xl"
    >
      <div className="flex items-center gap-2 mb-2">
         <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-athena-amber/20 border border-athena-amber/30">
            <Trophy className="h-3.5 w-3.5 text-athena-amber" />
         </div>
         <span className="text-[10px] font-black uppercase tracking-widest text-athena-amber">Battle Prediction</span>
      </div>

      <div className="text-sm font-bold text-foreground leading-relaxed">
        <MathContent content={predict.question} />
      </div>

      <div className="grid gap-2">
        {predict.options.map((option, i) => {
          const isThis = selected === i;
          const isRight = i === predict.correctOption;
          const isWrong = wrongIndices.has(i);
          return (
            <motion.button
              key={i}
              whileHover={!revealed && !isWrong ? { scale: 1.02, x: 4 } : {}}
              whileTap={!revealed && !isWrong ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(i)}
              disabled={revealed || isWrong}
              className={cn(
                "group flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-300",
                !revealed && !isWrong && "border-white/5 bg-white/5 hover:border-athena-amber/30 hover:bg-athena-amber/5 cursor-pointer",
                revealed && isRight && "border-green-500/50 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.15)]",
                revealed && isThis && !isRight && "border-red-500/50 bg-red-500/10",
                revealed && !isThis && !isRight && "opacity-40 grayscale",
                isWrong && !revealed && "border-red-500/30 bg-red-500/5 opacity-60 grayscale cursor-not-allowed",
              )}
            >
              <span className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[10px] font-black transition-colors",
                revealed && isRight ? "border-green-500 bg-green-500 text-white" : 
                (revealed && isThis && !isRight) || isWrong ? "border-red-500 bg-red-500 text-white" :
                "border-white/20 bg-black/20 text-muted-foreground group-hover:border-athena-amber/40 group-hover:text-athena-amber"
              )}>
                {revealed && isRight ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (revealed && isThis && !isRight) || isWrong ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </span>
              <span className="font-medium flex-1">
                <MathContent content={option} />
              </span>
            </motion.button>
          );
        })}
      </div>

      {showHint && !revealed && predict.hint && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-athena-amber/30 bg-athena-amber/10 p-3 shadow-[0_0_20px_rgba(251,191,36,0.05)]"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Wand2 className="h-3.5 w-3.5 text-athena-amber" />
            <p className="text-[10px] font-black uppercase tracking-widest text-athena-amber">
              Strategic Insight
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed italic">
             &ldquo;{predict.hint}&rdquo;
          </p>
        </motion.div>
      )}

      {revealed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="pt-2 space-y-3"
        >
          <div className="h-px bg-white/5 w-full" />
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
               <AlertTriangle className="h-3 w-3 text-muted-foreground" />
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">The Lore</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{predict.explanation}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Fill-blank question UI ──────────────────────────────────────────

function FillBlankCard({
  fillBlank,
  onAnswer,
  onNarrate,
  onHintPhase,
  onResult,
}: {
  fillBlank: FillBlankAction;
  onAnswer: () => void;
  onNarrate?: (text: string) => void;
  onHintPhase?: (phase: "none" | "hinted" | "detailed") => void;
  onResult?: (correct: boolean) => void;
}) {
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [phase, setPhase] = useState<"answering" | "hinted" | "detailed" | "revealed">("answering");
  const [lastWrong, setLastWrong] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const answeredRef = useRef(false);
  const sound = useSound();

  const isRevealed = phase === "revealed";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (lastWrong) {
      const t = setTimeout(() => setLastWrong(false), 500);
      return () => clearTimeout(t);
    }
  }, [lastWrong]);

  useEffect(() => {
    if (isRevealed && !answeredRef.current) {
      answeredRef.current = true;
      onAnswer();
    }
  }, [isRevealed, onAnswer]);

  const checkAnswer = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const isCorrect = fillBlank.acceptedAnswers.some(
      (a) => a.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isCorrect) {
      sound.achievement();
      setPhase("revealed");
      onResult?.(true);
      onNarrate?.("Correct! Let's move on.");
      return;
    }

    sound.wrong();
    onResult?.(false);
    setLastWrong(true);
    setInput("");
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts === 1 && fillBlank.hint) {
      setPhase("hinted");
      onHintPhase?.("hinted");
      onNarrate?.(fillBlank.hint);
    } else if (newAttempts === 2 && fillBlank.detailedHint) {
      setPhase("detailed");
      onHintPhase?.("detailed");
      onNarrate?.(fillBlank.detailedHint);
    } else if (newAttempts >= 3 || (newAttempts >= 2 && !fillBlank.detailedHint)) {
      setPhase("revealed");
    }

    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const isCorrect = phase === "revealed" && fillBlank.acceptedAnswers.some(
    (a) => a.trim().toLowerCase() === input.trim().toLowerCase()
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative space-y-4 rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md shadow-xl"
    >
      <div className="flex items-center gap-2 mb-2">
         <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-athena-amber/20 border border-athena-amber/30">
            <Zap className="h-3.5 w-3.5 text-athena-amber" />
         </div>
         <span className="text-[10px] font-black uppercase tracking-widest text-athena-amber">Battle Puzzle</span>
      </div>

      <div className="text-sm font-bold text-foreground leading-relaxed">
        <MathContent content={fillBlank.prompt} />
      </div>

      {!isRevealed && (
        <motion.div
          animate={lastWrong ? { x: [-4, 4, -4, 4, 0] } : {}}
          transition={{ duration: 0.3 }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") checkAnswer(); }}
            placeholder="Wield your answer..."
            className="flex-1 bg-black/40 rounded-xl text-sm outline-none placeholder:text-muted-foreground/40 py-3 px-4 border border-white/5 focus:border-athena-amber/50 transition-all shadow-inner"
          />
          <Button 
            className="rounded-xl bg-athena-amber text-black font-bold hover:bg-athena-amber/90" 
            onClick={checkAnswer} 
            disabled={!input.trim()}
          >
            Check
          </Button>
        </motion.div>
      )}

      {(phase === "hinted" || phase === "detailed") && fillBlank.hint && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-athena-amber/30 bg-athena-amber/10 p-3 shadow-[0_0_20px_rgba(251,191,36,0.05)]"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Wand2 className="h-3.5 w-3.5 text-athena-amber" />
            <p className="text-[10px] font-black uppercase tracking-widest text-athena-amber">
              Enchanted Hint
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed italic">
             &ldquo;{fillBlank.hint}&rdquo;
          </p>
        </motion.div>
      )}

      {phase === "detailed" && fillBlank.detailedHint && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 shadow-[0_0_20px_rgba(59,130,246,0.05)]"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Shield className="h-3.5 w-3.5 text-blue-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              Battle Master Tips
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed italic">
             &ldquo;{fillBlank.detailedHint}&rdquo;
          </p>
        </motion.div>
      )}

      {isRevealed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="pt-2 space-y-3"
        >
          <div className="h-px bg-white/5 w-full" />
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
               <AlertTriangle className="h-3 w-3 text-muted-foreground" />
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">The Solution</span>
            </div>
            {isCorrect ? (
              <p className="text-sm font-black text-green-500 mb-1">Victory! You solved it.</p>
            ) : (
              <p className="text-sm font-medium text-foreground mb-1">
                The correct answer was: <span className="font-black text-athena-amber">{fillBlank.acceptedAnswers[0]}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground leading-relaxed">{fillBlank.explanation}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────

export function MicroLesson({
  topic,
  subtopic,
  metadata,
  onClose,
  practiceProblems: providedPracticeProblems,
  streamUrl,
  chatStreamUrl,
  existingLesson,
  subtopicApiPath,
  practiceMode,
  tracking,
}: MicroLessonProps) {
  const {
    phase,
    lessonContent,
    whiteboardSteps,
    isWhiteboardStreaming,
    generateLesson,
    updateTracking,
  } = useMicroLesson({ topic, subtopic, metadata, streamUrl, chatStreamUrl, existingLesson, subtopicApiPath, tracking });

  const {
    state: playerState,
    userStepIndex,
    currentStepIndex,
    stepProgress,
    visibleStepIds,
    isLastStep,
    isCheckIn,
    currentCheckIn,
    isInteraction,
    currentPrediction,
    currentFillBlank,
    advance,
  } = useStepPlayer(whiteboardSteps, isWhiteboardStreaming);

  // ── "Why?" modal state ──────────────────────────────────────────────
  const [whyModalOpen, setWhyModalOpen] = useState(false);

  // ── Practice phase state ─────────────────────────────────────────────

  type LessonPhase = "lesson" | "practice" | "complete";
  const [lessonPhase, setLessonPhase] = useState<LessonPhase>("lesson");
  const [fetchedPracticeProblems, setFetchedPracticeProblems] = useState<Problem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [practiceCorrectCount, setPracticeCorrectCount] = useState(0);
  const [isPracticeLoading, setIsPracticeLoading] = useState(false);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [xpPulse, setXpPulse] = useState(false);
  const [activeGraphAction, setActiveGraphAction] = useState<CoordinatePlaneAction | null>(null);
  const prefetchedRef = useRef(false);
  const seenStepRef = useRef<number>(-1);

  // Map to hold student's modifications to graphs
  const [graphOverrides, setGraphOverrides] = useState<Map<number, CoordinatePlaneAction>>(new Map());

  const activePracticeProblems = providedPracticeProblems ?? fetchedPracticeProblems;
  const currentPracticeProblem = activePracticeProblems[currentProblemIndex] ?? null;
  const currentLevel = Math.max(1, Math.floor(xp / 120) + 1);

  const pulseXp = useCallback(() => {
    setXpPulse(true);
    window.setTimeout(() => setXpPulse(false), 300);
  }, []);

  const unlockBadge = useCallback((badge: string) => {
    setUnlockedBadges((prev) => {
      if (prev.includes(badge)) return prev;
      toast.success(`Badge unlocked: ${badge}`);
      return [...prev, badge];
    });
  }, []);

  const [floatingXp, setFloatingXp] = useState<{ id: number; value: number }[]>([]);

  const awardXp = useCallback((value: number, reason?: string) => {
    setXp((prev) => prev + value);
    pulseXp();
    const id = Date.now();
    setFloatingXp(prev => [...prev, { id, value }]);
    setTimeout(() => setFloatingXp(prev => prev.filter(x => x.id !== id)), 2000);
    if (reason) toast.success(`+${value} XP · ${reason}`);
  }, [pulseXp]);

  const handleInteractionResult = useCallback((correct: boolean) => {
    if (correct) {
      setStreak((prev) => prev + 1);
      awardXp(30, "Correct interaction");
    } else {
      setStreak(0);
      awardXp(8, "Attempt logged");
    }
  }, [awardXp]);

  useEffect(() => {
    if (streak >= 3) unlockBadge("On Fire");
    if (xp >= 200) unlockBadge("XP Hunter");
    if (lessonPhase === "complete") unlockBadge("Module Complete");
  }, [streak, xp, lessonPhase, unlockBadge]);

  const fetchPracticeProblems = useCallback(async () => {
    if (providedPracticeProblems) return;
    setIsPracticeLoading(true);
    try {
      const res = await fetch("/api/agent/practice-problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          subtopic,
          subject: practiceMode?.subject ?? "math",
        }),
      });
      if (!res.ok) throw new Error("Failed to load practice problems");
      const data = await res.json();
      setFetchedPracticeProblems((data.problems as Problem[]).slice(0, 2));
    } catch {
      toast.error("Could not load practice problems");
      setLessonPhase("complete");
    } finally {
      setIsPracticeLoading(false);
    }
  }, [topic, subtopic, practiceMode?.subject, providedPracticeProblems]);

  // Pre-fetch problems near end of lesson
  useEffect(() => {
    if (
      prefetchedRef.current ||
      providedPracticeProblems ||
      whiteboardSteps.length === 0 ||
      userStepIndex < whiteboardSteps.length - 3
    ) return;
    prefetchedRef.current = true;
    fetchPracticeProblems();
  }, [userStepIndex, whiteboardSteps.length, fetchPracticeProblems, providedPracticeProblems]);

  // ── Chat state ───────────────────────────────────────────────────────

  const [isChatting, setIsChatting] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveGraphAction(null);
  }, [userStepIndex, lessonPhase, isChatting]);

  const chat = useLessonChat({
    topic,
    subtopic,
    lessonContent,
    metadata,
    whiteboardSteps,
    currentStepIndex: userStepIndex,
    chatStreamUrl,
    currentPracticeProblem: lessonPhase === "practice" ? currentPracticeProblem : null,
  });

  // Build visible IDs for chat whiteboard — progressive reveal synced with narration
  const chatVisibleIds = useMemo(() => {
    const ids = new Set<number>();
    const upTo = Math.min(
      Math.max(chat.chatNarrationIndex, 0),
      chat.chatWhiteboardSteps.length - 1,
    );
    for (let i = 0; i <= upTo; i++) {
      const step = chat.chatWhiteboardSteps[i];
      if (step.action.type === "clear") {
        ids.clear();
      } else if (step.action.type === "erase" && step.action.targetStepIndices) {
        for (const idx of step.action.targetStepIndices) {
          const target = chat.chatWhiteboardSteps[idx];
          if (target) ids.delete(target.id);
        }
      }
      ids.add(step.id);
    }
    return ids;
  }, [chat.chatWhiteboardSteps, chat.chatNarrationIndex]);

  // Track which hint tier the student is on (for canvas visual updates)
  const [interactionHintPhase, setInteractionHintPhase] = useState<"none" | "hinted" | "detailed">("none");

  // ── Tracking: push step/checkin counts to session tracking ────────
  const checkinsCorrectRef = useRef(0);
  const checkinsTotalRef = useRef(0);

  useEffect(() => {
    updateTracking({ stepsViewed: Math.max(0, userStepIndex + 1) });
  }, [userStepIndex, updateTracking]);

  useEffect(() => {
    if (userStepIndex <= seenStepRef.current) return;
    seenStepRef.current = userStepIndex;
    if (userStepIndex >= 0) awardXp(4);
  }, [userStepIndex, awardXp]);

  // Reset hint phase when advancing to a new step
  const wrappedAdvance = useCallback(() => {
    // If advancing past a check-in, count it
    const step = whiteboardSteps[userStepIndex];
    if (step && step.action.type === "check_in") {
      checkinsTotalRef.current++;
      // Check-in was answered correctly if the player advanced (onAnswer is only called on completion)
      checkinsCorrectRef.current++;
      updateTracking({
        checkinsCorrect: checkinsCorrectRef.current,
        checkinsTotal: checkinsTotalRef.current,
      });
    }
    setInteractionHintPhase("none");
    advance();
  }, [advance, whiteboardSteps, userStepIndex, updateTracking]);

  // Build synthetic step for interaction visual (shown on canvas during check-in/predict/fill_blank)
  // Selects the appropriate visual based on hint phase with fallback chain
  const activeInteractionVisual = useMemo(() => {
    const action = currentCheckIn ?? currentPrediction ?? currentFillBlank ?? null;
    if (!action) return null;

    if (interactionHintPhase === "detailed" && "detailedHintVisual" in action) {
      return action.detailedHintVisual ?? ("hintVisual" in action ? action.hintVisual : null) ?? action.visual ?? null;
    }
    if (interactionHintPhase === "hinted" && "hintVisual" in action) {
      return action.hintVisual ?? action.visual ?? null;
    }
    return action.visual ?? null;
  }, [currentCheckIn, currentPrediction, currentFillBlank, interactionHintPhase]);

  const interactionVisualStep = useMemo(() => {
    if (!isInteraction || !activeInteractionVisual) return null;
    return { id: -1, delayMs: 0, durationMs: 0, action: activeInteractionVisual } as WhiteboardStep;
  }, [isInteraction, activeInteractionVisual]);

  const interactionVisualIds = useMemo(
    () => (interactionVisualStep ? new Set([-1]) : null),
    [interactionVisualStep],
  );

  // ── Narration state ──────────────────────────────────────────────────

  const [isNarrating, setIsNarrating] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const advanceRef = useRef(wrappedAdvance);
  advanceRef.current = wrappedAdvance;
  const isChattingRef = useRef(isChatting);
  isChattingRef.current = isChatting;
  const whyModalOpenRef = useRef(whyModalOpen);
  whyModalOpenRef.current = whyModalOpen;

  // Start lesson generation on mount
  useEffect(() => {
    generateLesson();
  }, [generateLesson]);

  // ── Pause lesson when chat opens ─────────────────────────────────────

  useEffect(() => {
    if (isChatting) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsNarrating(false);
      setIsTtsLoading(false);
    }
  }, [isChatting]);

  useEffect(() => {
    if (chat.ttsFailed) {
      toast.error("Couldn't play audio for that response.", { duration: 3000 });
    }
  }, [chat.ttsFailed]);

  const closeChat = useCallback(() => {
    setIsChatting(false);
    chat.clearChat();
  }, [chat]);

  // ── TTS narration ──────────────────────────────────────────────────
  // Teaching steps: narrate on arrival (while visual animates)
  // Predict/fill_blank: narrate AFTER student answers (called via playNarration)
  // Check-in: narrate question on arrival

  const playNarration = useCallback((text: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (isChattingRef.current || !text) return;

    setIsTtsLoading(true);
    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch("/api/agent/text-to-speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (cancelled || !res.ok) {
          if (!cancelled) { setIsTtsLoading(false); setIsNarrating(false); }
          return;
        }
        const blob = await res.blob();
        if (cancelled) return;

        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          if (!cancelled) setIsNarrating(false);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          if (!cancelled) setIsNarrating(false);
        };

        if (cancelled || isChattingRef.current) return;

        audio.play().then(() => {
          if (!cancelled && !isChattingRef.current) {
            setIsTtsLoading(false);
            setIsNarrating(true);
          }
        }).catch(() => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          if (!cancelled) { setIsTtsLoading(false); setIsNarrating(false); }
        });
      } catch {
        if (!cancelled) { setIsTtsLoading(false); setIsNarrating(false); }
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

  // Auto-narrate all steps on arrival:
  // teaching: narrates the displayText/narration (what's being shown)
  // predict/fill_blank/check_in: narrates the QUESTION text so the tutor reads it aloud
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (isChattingRef.current) return;
    if (whyModalOpenRef.current) return;

    const step = whiteboardSteps[userStepIndex];
    if (!step) return;

    let narration: string | undefined;
    if (step.action.type === "check_in") {
      narration = (step.action as CheckInAction).question.trim();
    } else if (step.action.type === "predict") {
      narration = (step.action as PredictAction).question.trim();
    } else if (step.action.type === "fill_blank") {
      narration = (step.action as FillBlankAction).prompt.trim();
    } else {
      narration = step.narration?.trim();
    }
    if (!narration) return;

    const cancel = playNarration(narration);

    return () => {
      cancel?.();
      setIsTtsLoading(false);
      setIsNarrating(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userStepIndex, playNarration]);

  // ── Auto-advance teaching steps when narration + animation done ─────

  useEffect(() => {
    const step = whiteboardSteps[userStepIndex];
    if (!step) return;
    // Only auto-advance teaching steps (not interactions)
    const t = step.action.type;
    if (t === "check_in" || t === "predict" || t === "fill_blank") return;
    if (isLastStep) return;
    if (isChatting) return;
    if (whyModalOpen) return;
    if (activeGraphAction !== null) return;

    if (playerState === "waiting" && !isNarrating && !isTtsLoading) {
      advanceRef.current();
    }
  }, [playerState, isNarrating, isTtsLoading, isLastStep, isChatting, whyModalOpen, activeGraphAction, userStepIndex, whiteboardSteps]);

  // Callback for predict/fill_blank: play narration after student answers, then advance after delay
  const handleInteractionAnswer = useCallback(() => {
    // Brief delay so the student can read the explanation before advancing
    setTimeout(() => advanceRef.current(), 1200);
  }, []);

  // Transition to practice phase when lesson completes
  useEffect(() => {
    if (isLastStep && lessonPhase === "lesson") {
      setLessonPhase("practice");
      // If problems weren't pre-fetched, fetch now
      if (!providedPracticeProblems && fetchedPracticeProblems.length === 0 && !prefetchedRef.current) {
        fetchPracticeProblems();
      }
    }
  }, [isLastStep, lessonPhase, providedPracticeProblems, fetchedPracticeProblems.length, fetchPracticeProblems]);

  // Mark complete when all practice problems are done
  useEffect(() => {
    if (lessonPhase === "practice" && activePracticeProblems.length > 0 && currentProblemIndex >= activePracticeProblems.length) {
      setLessonPhase("complete");
    }
  }, [lessonPhase, activePracticeProblems.length, currentProblemIndex]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // ── Chat input handlers ──────────────────────────────────────────────

  // Auto-resize textarea
  useEffect(() => {
    const ta = chatTextareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 56) + "px";
  }, [chatInput]);

  // Scroll chat history on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chat.chatMessages]);

  // Auto-scroll left panel when content changes (new narration, hint/explanation appear)
  useEffect(() => {
    const el = contentScrollRef.current;
    if (!el || isChatting) return;

    let timer: ReturnType<typeof setTimeout>;
    const scrollToBottom = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (el.scrollHeight > el.clientHeight) {
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }
      }, 80);
    };

    const observer = new MutationObserver(scrollToBottom);
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [isChatting]);

  const handleChatSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || chat.isProcessing) return;
      setIsChatting(true);
      chat.sendChat(chatInput.trim());
      setChatInput("");
      if (chatTextareaRef.current) chatTextareaRef.current.style.height = "auto";
    },
    [chatInput, chat],
  );

  // Auto-enter chat mode when voice recording triggers processing
  useEffect(() => {
    if (chat.isProcessing && !isChatting) {
      setIsChatting(true);
    }
  }, [chat.isProcessing, isChatting]);

  const handleChatKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChatSubmit(e);
      }
    },
    [handleChatSubmit],
  );

  // ── Derived state ────────────────────────────────────────────────────

  const currentDisplayText = whiteboardSteps[userStepIndex]?.displayText
    ?? whiteboardSteps[userStepIndex]?.narration ?? "";
  const hasChatSteps = chat.chatWhiteboardSteps.length > 0;
  const emptyVisibleIds = useMemo(() => new Set<number>(), []);
  const isPracticeCanvas = (lessonPhase === "practice" || lessonPhase === "complete") && !isChatting;
  const lessonProgress = whiteboardSteps.length > 0 ? Math.min(1, Math.max(0, (userStepIndex + 1) / whiteboardSteps.length)) : 0;
  const practiceProgress = activePracticeProblems.length > 0 ? Math.min(1, currentProblemIndex / activePracticeProblems.length) : 0;
  const overallProgress = lessonPhase === "lesson"
    ? lessonProgress * 0.8
    : lessonPhase === "practice"
      ? 0.8 + practiceProgress * 0.2
      : 1;
  const levelTitle = currentLevel <= 2
    ? "Linear Functions"
    : currentLevel <= 4
      ? "Quadratic Mastery"
      : "Graph Tactician";

  const voiceOrbState: "idle" | "listening" | "processing" | "speaking" =
    chat.isRecording ? "listening" : chat.isProcessing ? "processing" : chat.isSpeaking ? "speaking" : "idle";

  // ── Generating state ──────────────────────────────────────────────
  const isGenerating = phase === "generating" && whiteboardSteps.length === 0;

  // ── Character state ────────────────────────────────────────────────
  const pixelEmotion: "neutral" | "happy" | "thinking" | "encouraging" = isGenerating
    ? "thinking"
    : isChatting
      ? (chat.isProcessing ? "thinking" : chat.isChatNarrating ? "happy" : "neutral")
      : lessonPhase === "practice" || lessonPhase === "complete"
        ? "encouraging"
        : isInteraction
          ? "encouraging"
          : isTtsLoading
            ? "thinking"
            : isNarrating
              ? "happy"
              : "neutral";
  const pixelTalking = isNarrating || chat.isChatNarrating;
  const pixelLoading = isTtsLoading && !pixelTalking;

  return (
    <div 
      ref={mainScrollRef}
      className="relative mx-auto flex-1 flex w-full max-w-none flex-col overflow-y-auto overflow-x-hidden px-2 sm:px-3"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-card/65 px-4 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <BookOpen className="h-4 w-4 text-athena-amber" />
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
              {lessonPhase === "practice" || lessonPhase === "complete"
                ? `Arena: ${subtopic}`
                : `Micro-Lesson: ${subtopic}`}
            </h3>
            {phase === "generating" && (
              <motion.span
                className="text-[10px] font-black uppercase tracking-widest text-athena-amber"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Summoning knowledge…
              </motion.span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <motion.div
              animate={xpPulse ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300"
            >
              XP {xp}
            </motion.div>
            <div className="rounded-full border border-sky-400/35 bg-sky-500/10 px-3 py-1 text-xs font-black text-sky-300">
              Level {currentLevel}: {levelTitle}
            </div>
            <div className="rounded-full border border-athena-amber/35 bg-athena-amber/10 px-3 py-1 text-xs font-black text-athena-amber">
              Streak {streak}
            </div>
          </div>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="space-y-1">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-athena-amber via-emerald-400 to-sky-400"
                animate={{ width: `${Math.round(overallProgress * 100)}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
            <p className="text-[11px] font-semibold text-muted-foreground">
              Progress {Math.round(overallProgress * 100)}% · Lesson {Math.round(lessonProgress * 100)}% · Practice {Math.round(practiceProgress * 100)}%
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {unlockedBadges.length === 0 ? (
              <span className="text-[11px] text-muted-foreground">No badges yet</span>
            ) : (
              unlockedBadges.slice(-3).map((badge) => (
                <motion.span
                  key={badge}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-full border border-athena-amber/35 bg-athena-amber/10 px-2 py-1 text-[10px] font-bold text-athena-amber"
                >
                  {badge}
                </motion.span>
              ))
            )}
          </div>
        </div>

        <motion.button
          onClick={() => setWhyModalOpen(true)}
          className="relative mt-3 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-amber-300 cursor-pointer overflow-hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Siri-style animated gradient glow */}
          <motion.div
            className="absolute inset-0 rounded-full opacity-60"
            style={{
              background:
                "linear-gradient(135deg, rgba(251,191,36,0.25), rgba(244,114,182,0.2), rgba(129,140,248,0.2), rgba(251,191,36,0.25))",
              backgroundSize: "300% 300%",
            }}
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Soft pulsing border glow */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: "inset 0 0 0 1px rgba(251,191,36,0.3)",
            }}
            animate={{
              boxShadow: [
                "inset 0 0 0 1px rgba(251,191,36,0.3), 0 0 6px rgba(251,191,36,0.15)",
                "inset 0 0 0 1px rgba(244,114,182,0.3), 0 0 10px rgba(244,114,182,0.2)",
                "inset 0 0 0 1px rgba(129,140,248,0.3), 0 0 6px rgba(129,140,248,0.15)",
                "inset 0 0 0 1px rgba(251,191,36,0.3), 0 0 6px rgba(251,191,36,0.15)",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="relative flex items-center gap-1.5"
            animate={{
              color: ["#fbbf24", "#f472b6", "#818cf8", "#fbbf24"],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Lore</span>
          </motion.div>
        </motion.button>
      </div>

      {/* Error state */}
      {phase === "error" ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <p className="text-sm text-destructive">
            Failed to generate lesson. Please try again.
          </p>
          <Button variant="outline" size="sm" onClick={onClose}>
            Go Back
          </Button>
        </div>
      ) : (
        /* Left panel + canvas */
        <div className="relative z-10 flex flex-none flex-col gap-2 lg:flex-row h-auto">
          {/* Floating XP Rewards */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[100]">
            {floatingXp.map(x => (
              <motion.div
                key={x.id}
                initial={{ y: 0, opacity: 1, scale: 0.5 }}
                animate={{ y: -120, opacity: 0, scale: 1.8 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="text-5xl font-black text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.9)]"
              >
                +{x.value} XP
              </motion.div>
            ))}
          </div>
          {/* Left panel — tutor */}
          <div className="w-full flex flex-col rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl lg:w-[28%] lg:min-w-[280px] lg:max-w-[360px] lg:rounded-r-none lg:border-r h-auto">
            {/* Character — top of panel */}
            <div className="shrink-0 flex flex-col items-center gap-0.5 px-4 pt-4 pb-2">
              <PixelCharacter
                emotion={pixelEmotion}
                isTalking={pixelTalking}
                size={48}
              />
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-athena-amber font-black uppercase tracking-widest">
                  Athena Master
                </span>
                {(pixelTalking || pixelLoading) && (
                  <div className="flex items-center gap-[2px]">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className={cn(
                          "w-[3px] rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]",
                          pixelTalking ? "bg-athena-amber" : "bg-athena-amber/40"
                        )}
                        animate={
                          pixelTalking
                            ? { height: [3, 8 + i * 2, 3] }
                            : { height: [3, 5, 3], opacity: [0.3, 0.6, 0.3] }
                        }
                        transition={{
                          duration: pixelTalking ? 0.4 : 1.0,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable content area — narration/check-in/chat messages */}
            <div
              className="px-4 pb-6"
              ref={isChatting ? chatScrollRef : contentScrollRef}
            >
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div
                    key="generating"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center h-full pt-4"
                  >
                    <GenerationProgress />
                  </motion.div>
                ) : isChatting ? (
                  /* ── Chat messages — user bubbles + step-based tutor response ── */
                  <motion.div
                    key="chat-messages"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2 pt-1"
                  >
                    <button
                      onClick={closeChat}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      &larr; {lessonPhase === "practice" ? "Back to Arena" : "Resume Mastery"}
                    </button>

                    {/* Show only the last user question (full history still sent to agent) */}
                    {(() => {
                      const lastUserMsg = chat.chatMessages.findLast((msg) => msg.role === "user");
                      return lastUserMsg ? <MessageBubble key="user-last" role="user" content={lastUserMsg.content} /> : null;
                    })()}

                    {/* Tutor response: current step's displayText via MathContent */}
                    {chat.chatWhiteboardSteps.length > 0 && chat.chatNarrationIndex >= 0 && (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`chat-step-${Math.min(chat.chatNarrationIndex, chat.chatWhiteboardSteps.length - 1)}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="text-sm text-foreground min-h-[2.5rem] mb-2">
                            <MathContent
                              content={
                                chat.chatWhiteboardSteps[
                                  Math.min(chat.chatNarrationIndex, chat.chatWhiteboardSteps.length - 1)
                                ]?.displayText || ""
                              }
                            />
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    )}

                    {/* Thinking indicator while waiting for first step */}
                    <AnimatePresence>
                      {chat.isProcessing && chat.chatWhiteboardSteps.length === 0 && (
                          <ThinkingIndicator variant="prominent" />
                        )}
                    </AnimatePresence>
                  </motion.div>
                ) : (lessonPhase === "practice" || lessonPhase === "complete") && !isChatting ? (
                  /* ── Inline practice problems ── */
                  <motion.div
                    key="practice"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3 pt-1"
                  >
                    {isPracticeLoading && activePracticeProblems.length === 0 ? (
                      <div className="space-y-2 pt-2">
                        <SkeletonShimmer className="h-5 w-36" />
                        <SkeletonShimmer className="h-24 w-full" />
                        <SkeletonShimmer className="h-24 w-full" />
                        <p className="text-xs text-muted-foreground">Preparing practice arena…</p>
                      </div>
                    ) : lessonPhase === "complete" ? (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 text-center pt-4"
                      >
                        <CheckInConfetti />
                        <div className="flex flex-col items-center gap-1">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                          >
                            <CheckCircle className="h-10 w-10 text-green-500" />
                          </motion.div>
                          <p className="text-sm font-semibold">
                            {practiceCorrectCount}/{activePracticeProblems.length} correct
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {practiceCorrectCount === activePracticeProblems.length
                              ? "Perfect! Great work on this lesson."
                              : "Keep it up, you're making progress!"}
                          </p>
                        </div>
                        <Button size="sm" className="gap-1" onClick={onClose}>
                          Done
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </motion.div>
                    ) : currentPracticeProblem ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Practice {currentProblemIndex + 1} of {activePracticeProblems.length}
                          </span>
                          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-athena-amber rounded-full"
                              animate={{ width: `${(currentProblemIndex / activePracticeProblems.length) * 100}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentPracticeProblem.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                          >
                            <PracticeGradientCard
                              problem={currentPracticeProblem}
                              questionNumber={currentProblemIndex + 1}
                              onCorrect={() => {
                                setPracticeCorrectCount((c) => c + 1);
                                setStreak((s) => s + 1);
                                awardXp(40, "Practice solved");
                                setCurrentProblemIndex((i) => i + 1);
                              }}
                              onExhausted={() => {
                                setStreak(0);
                                awardXp(10, "Practice completed");
                                setCurrentProblemIndex((i) => i + 1);
                              }}
                            />
                          </motion.div>
                        </AnimatePresence>
                      </>
                    ) : null}
                  </motion.div>
                ) : isCheckIn && currentCheckIn ? (
                  /* ── Check-in ── */
                  <motion.div
                    key="check-in"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CheckInCard
                      key={`check-in-${userStepIndex}`}
                      checkIn={currentCheckIn}
                      onAnswer={wrappedAdvance}
                      onNarrate={(text) => playNarration(text)}
                      onHintPhase={setInteractionHintPhase}
                      onResult={handleInteractionResult}
                    />
                  </motion.div>
                ) : currentPrediction ? (
                  /* ── Predict ── */
                  <motion.div
                    key={`predict-${userStepIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <PredictCard
                      predict={currentPrediction}
                      onAnswer={handleInteractionAnswer}
                      onNarrate={(text) => playNarration(text)}
                      onHintPhase={setInteractionHintPhase}
                      onResult={handleInteractionResult}
                    />
                  </motion.div>
                ) : currentFillBlank ? (
                  /* ── Fill blank ── */
                  <motion.div
                    key={`fill-blank-${userStepIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <FillBlankCard
                      fillBlank={currentFillBlank}
                      onAnswer={handleInteractionAnswer}
                      onNarrate={(text) => playNarration(text)}
                      onHintPhase={setInteractionHintPhase}
                      onResult={handleInteractionResult}
                    />
                  </motion.div>
                ) : (
                  /* ── Teaching step or last step ── */
                  <motion.div
                    key={`narration-${userStepIndex}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-sm text-foreground min-h-[2.5rem] mb-2">
                      <MathContent content={currentDisplayText} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Chat input — always visible at bottom of left panel */}
            <div className="shrink-0 border-t px-4 py-3">
              {chat.mode === "text" ? (
                <form onSubmit={handleChatSubmit}>
                  <textarea
                    ref={chatTextareaRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder={lessonPhase === "practice" ? "Seek tactical advice…" : "Ask your mentor…"}
                    className="w-full bg-black/40 rounded-xl text-sm outline-none placeholder:text-muted-foreground/30 resize-none min-h-[42px] max-h-[64px] py-2.5 px-4 border border-white/5 focus:border-athena-amber/40 transition-all shadow-inner"
                    rows={1}
                    disabled={isGenerating || chat.isProcessing}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={chat.toggleMode}
                      title="Switch to voice"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <motion.div
                      whileTap={{ scale: 0.9, rotate: -12 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <Button
                        type="submit"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        disabled={!chatInput.trim() || chat.isProcessing}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="scale-75 origin-center">
                    <VoiceOrb
                      state={voiceOrbState}
                      amplitude={chat.amplitude}
                      onTap={
                        chat.isRecording
                          ? chat.stopRecording
                          : chat.startRecording
                      }
                      disabled={chat.isProcessing && !chat.isRecording}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground text-center">
                    {chat.isRecording
                      ? "Listening… tap to stop"
                      : chat.isProcessing
                        ? "Processing…"
                        : chat.isSpeaking
                          ? "Speaking…"
                          : "Tap to speak"}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-xs"
                    onClick={chat.toggleMode}
                  >
                    <Keyboard className="h-3.5 w-3.5" />
                    Text
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right panel — canvas */}
          <div className="flex-1 flex flex-col rounded-2xl border border-white/10 bg-card/35 backdrop-blur-xl h-auto">
           <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
             <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/70 px-2.5 py-1 text-xs font-semibold">
               <span className="h-2 w-2 rounded-full bg-emerald-400" />
               {activeGraphAction ? "Graph Mission Mode" : "Lesson Canvas"}
             </div>
             <p className="text-[11px] text-muted-foreground">
               {activeGraphAction ? "Drag points to experiment • Ctrl+Z / Ctrl+Y" : "Tap an in-lesson graph to interact"}
             </p>
           </div>

           <div className="flex-1 min-h-0 p-2">
           {activeGraphAction ? (
             <div className="relative h-full">
                <div className="absolute right-2 top-2 z-10 flex gap-2">
                  <button
                    className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
                    onClick={() => {
                      toast.success("Graph synchronized with lesson!");
                      setActiveGraphAction(null);
                    }}
                  >
                    Apply to Lesson
                  </button>
                  <button
                    className="rounded-md border border-border bg-background/85 px-2 py-1 text-xs font-semibold hover:bg-muted"
                    onClick={() => setActiveGraphAction(null)}
                  >
                    Close
                  </button>
                </div>
               <InteractiveGraphSystem
                 initialPlane={activeGraphAction}
                 onXpEarn={(value, reason) => awardXp(value, reason)}
               />
             </div>
           ) : (
           <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="skeleton"
                className="h-full w-full"
                exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <WhiteboardSkeleton className="h-full" />
              </motion.div>
            ) : interactionVisualStep && (interactionVisualStep.action.type === "coordinate_plane" || interactionVisualStep.action.type === "geometry") ? (
            <motion.div key={`interaction-visual-${interactionHintPhase}`} className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {interactionVisualStep.action.type === "coordinate_plane" ? (
                <button
                  className="group relative h-full w-full overflow-hidden rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-background/70 to-emerald-500/10 text-left"
                  onClick={() => {
                    setActiveGraphAction(interactionVisualStep.action as CoordinatePlaneAction);
                    awardXp(12, "Graph challenge unlocked");
                  }}
                >
                  <div className="absolute left-3 top-3 z-10 rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-300">
                    Tap Graph To Interact
                  </div>
                  <svg
                    viewBox="0 0 520 460"
                    className="h-full w-full"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <WbCoordinatePlane
                      action={interactionVisualStep.action as CoordinatePlaneAction}
                      x={10} y={10} width={500} height={440}
                      progress={1} isAnimating={false}
                    />
                  </svg>
                </button>
              ) : (
                <svg
                  viewBox="0 0 520 460"
                  className="max-w-full max-h-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <WbGeometry
                    action={interactionVisualStep.action as GeometryAction}
                    x={10} y={10} width={500} height={440}
                    progress={1} isAnimating={false}
                  />
                </svg>
              )}
            </motion.div>
           ) : (
            <motion.div
              key={interactionVisualStep ? `canvas-${interactionHintPhase}` : "canvas"}
              className={`h-full w-full ${isChatting && hasChatSteps ? "min-h-[400px]" : ""}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
            <WhiteboardCanvas
              steps={
                interactionVisualStep ? [interactionVisualStep]
                : isChatting && hasChatSteps ? chat.chatWhiteboardSteps
                : whiteboardSteps
              }
              visibleStepIds={
                isPracticeCanvas ? emptyVisibleIds
                : interactionVisualIds ? interactionVisualIds
                : isChatting && hasChatSteps ? chatVisibleIds
                : visibleStepIds
              }
              currentStepIndex={
                interactionVisualStep ? 0
                : isChatting && hasChatSteps
                  ? Math.min(Math.max(chat.chatNarrationIndex, 0), chat.chatWhiteboardSteps.length - 1)
                  : currentStepIndex
              }
              stepProgress={
                interactionVisualStep ? 1
                : isChatting && hasChatSteps ? 1
                : stepProgress
              }
              containerRef={mainScrollRef}
              equalScaleCoords
              onCoordinatePlaneClick={(action) => {
                setActiveGraphAction(action);
                awardXp(12, "Graph challenge unlocked");
                if (audioRef.current) {
                  audioRef.current.pause();
                }
              }}
            />
            </motion.div>
           )}
           </AnimatePresence>
           )}
           </div>
          </div>
        </div>
      )}
      <WhyThisMattersModal
        open={whyModalOpen}
        onOpenChange={setWhyModalOpen}
        topic={topic}
        subtopic={subtopic}
        metadata={metadata}
        loreApiPath={subtopicApiPath?.replace(/\/micro-lesson$/, "/lore")}
      />
    </div>
  );
}

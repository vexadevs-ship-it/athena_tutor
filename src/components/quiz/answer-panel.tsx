"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MathContent } from "./math-content";
import type { Problem } from "./types";

export type FeedbackState = {
  type: "correct" | "wrong";
  correctOption: number;
};

type AnswerPanelProps = {
  problem: Problem;
  questionNumber: number;
  selectedOption: number | undefined;
  isMarked: boolean;
  onSelect: (optionIndex: number) => void;
  onToggleMark: () => void;
  direction: number; // 1 = forward, -1 = backward
  /** After server validates, highlight correct (green) and wrong-selected (red) */
  feedbackState?: FeedbackState;
  /** Prevent re-answering after validation */
  disabled?: boolean;
  /** Hide "Mark for Review" button (default true) */
  showMark?: boolean;
  /** Extra content rendered below the options (e.g. explanation panel) */
  children?: React.ReactNode;
};

export function AnswerPanel({
  problem,
  questionNumber,
  selectedOption,
  isMarked,
  onSelect,
  onToggleMark,
  direction,
  feedbackState,
  disabled,
  showMark = true,
  children,
}: AnswerPanelProps) {
  const choices = Array.isArray(problem.options) ? problem.options : [];

  return (
    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-muted">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted border border-border text-[10px] font-black">
             {questionNumber}
           </div>
           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Response</span>
        </div>
        {showMark && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMark}
            className={cn(
              "h-8 rounded-lg px-3 transition-all",
              isMarked ? "bg-athena-amber/20 text-athena-amber border border-athena-amber/30" : "text-muted-foreground hover:bg-accent border border-transparent"
            )}
          >
            <Bookmark
              className={cn("mr-2 h-3.5 w-3.5", isMarked && "fill-athena-amber")}
            />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isMarked ? "Flagged" : "Flag for Review"}
            </span>
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={problem.id}
          custom={direction}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="space-y-3"
        >
          {choices.length === 0 && (
            <div className="rounded-xl border border-athena-amber/30 bg-athena-amber/10 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-athena-amber">Loading Responses</p>
              <p className="mt-1 text-sm text-muted-foreground">Athena is preparing interactive answer choices for this question.</p>
            </div>
          )}

          {choices.map((option, i) => {
            const letter = String.fromCharCode(65 + i);
            const isSelected = selectedOption === i;

            const isCorrectFeedback = feedbackState && feedbackState.type === "correct" && i === feedbackState.correctOption;
            const isWrongFeedback =
              feedbackState &&
              feedbackState.type === "wrong" &&
              isSelected;

            return (
              <motion.button
                key={i}
                whileHover={!disabled ? { scale: 1.01, x: 4 } : {}}
                whileTap={!disabled ? { scale: 0.99 } : {}}
                onClick={() => !disabled && onSelect(i)}
                disabled={disabled}
                className={cn(
                  "group flex w-full items-start gap-4 rounded-xl border p-4 text-left text-sm transition-all duration-300",
                  // Default states (no feedback)
                  !feedbackState && isSelected
                    ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                    : !feedbackState && !disabled
                      ? "border-border bg-card hover:border-primary/30 hover:bg-accent/50"
                      : "border-border bg-card/50 opacity-60",
                  // Feedback states
                  isCorrectFeedback && "border-green-500/50 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.15)]",
                  isWrongFeedback && "border-red-500/50 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.15)]",
                  // Dim non-relevant options after feedback
                  feedbackState && !isCorrectFeedback && !isWrongFeedback && "opacity-40 grayscale blur-[0.5px]",
                  disabled && !isSelected && !feedbackState && "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[11px] font-black transition-all duration-300",
                    !feedbackState && isSelected && "border-primary bg-primary text-primary-foreground scale-110",
                    !feedbackState && !isSelected && "border-border bg-muted text-muted-foreground group-hover:border-primary/50 group-hover:text-primary",
                    isCorrectFeedback && "border-green-500 bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]",
                    isWrongFeedback && "border-red-500 bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  )}
                >
                  {letter}
                </span>
                <span className="pt-1 flex-1 font-medium leading-relaxed">
                  <MathContent content={option} />
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {children}
    </div>
  );
}

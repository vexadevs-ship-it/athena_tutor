"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MathContent } from "./math-content";
import type { Problem } from "./types";

type QuestionPanelProps = {
  problem: Problem;
  questionNumber: number;
  /** When true, hint button appears and hint is auto-opened */
  hintRevealed?: boolean;
};

export function QuestionPanel({ problem, questionNumber, hintRevealed = false }: QuestionPanelProps) {
  const [hintOpen, setHintOpen] = useState(false);
  const hasQuestion = typeof problem.questionText === "string" && problem.questionText.trim().length > 0;
  const showHintContent = hintRevealed || hintOpen;

  return (
    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
      <div className="mb-6 flex items-center gap-2">
         <div className="h-2 w-2 rounded-full bg-athena-amber shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
         <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
           Mission Objective: Question {questionNumber}
         </span>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        {hasQuestion ? (
          <MathContent content={problem.questionText} />
        ) : (
          <div className="rounded-xl border border-athena-amber/30 bg-athena-amber/10 p-4 not-prose">
            <p className="text-xs font-bold uppercase tracking-widest text-athena-amber">Summoning Question</p>
            <p className="mt-1 text-sm text-muted-foreground">Athena is loading the mission prompt. Try the next question and come back if this persists.</p>
          </div>
        )}
      </div>

      {problem.hint && hintRevealed && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <Button
            variant="ghost"
            size="sm"
            className="group h-auto p-0 text-athena-amber hover:bg-transparent"
            onClick={() => setHintOpen((h) => !h)}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-athena-amber/20 border border-athena-amber/30 mr-2 group-hover:bg-athena-amber/30 transition-colors">
              <Lightbulb className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">
              Tutor&apos;s Insight
            </span>
            {showHintContent ? (
              <ChevronUp className="ml-1 h-3 w-3 opacity-50" />
            ) : (
              <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
            )}
          </Button>
          <AnimatePresence>
            {showHintContent && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 rounded-xl border border-athena-amber/30 bg-athena-amber/5 p-4 text-sm text-muted-foreground italic leading-relaxed backdrop-blur-sm">
                  <MathContent content={problem.hint} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

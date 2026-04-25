"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Send, Mic, Keyboard, GraduationCap, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMentorConversation } from "@/hooks/use-mentor-conversation";
import { MessageBubble } from "@/components/lessons/message-bubble";
import { VoiceOrb } from "@/components/lessons/voice-orb";
import { ThinkingIndicator } from "@/components/lessons/thinking-indicator";
import { WhiteboardCanvas } from "@/components/whiteboard/whiteboard-canvas";
import { WhiteboardToolbar } from "@/components/whiteboard/whiteboard-toolbar";
import { WhiteboardTimeline } from "@/components/whiteboard/whiteboard-timeline";
import { useWhiteboardPlayer } from "@/hooks/use-whiteboard-player";
import type { SelectedElement } from "@/types/whiteboard";

const SUGGESTIONS = [
  "How am I doing overall?",
  "What should I focus on this week?",
  "Help me make a study plan",
  "I'm feeling stuck on math",
];

export default function MentorPage() {
  const [input, setInput] = useState("");
  const [selections, setSelections] = useState<SelectedElement[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);

  const {
    messages,
    mode,
    isRecording,
    isProcessing,
    isSpeaking,
    amplitude,
    whiteboardSteps,
    isWhiteboardStreaming,
    sendMessage,
    startRecording,
    stopRecording,
    toggleMode,
  } = useMentorConversation();

  const {
    currentStepIndex,
    stepProgress,
    visibleStepIds,
    state: playerState,
    speed,
    play,
    pause,
    replay,
    seekToStep,
    changeSpeed,
  } = useWhiteboardPlayer(whiteboardSteps, isWhiteboardStreaming);

  const hasWhiteboard = whiteboardSteps.length > 0;

  const checkNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isProcessing]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  useEffect(() => {
    if (isWhiteboardStreaming) {
      Promise.resolve().then(() => setSelections([]));
    }
  }, [isWhiteboardStreaming]);

  const handleElementSelect = useCallback(
    (el: SelectedElement | null) => {
      if (!el) {
        setSelections([]);
        return;
      }
      setSelections([el]);
      const q =
        el.type === "write_math"
          ? `Can you explain this step: $${el.content}$?`
          : `Can you explain this further: "${el.content}"?`;
      setInput(q);
      if (mode === "voice") toggleMode();
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
    [mode, toggleMode]
  );

  const handleElementToggle = useCallback((el: SelectedElement) => {
    setSelections((prev) => {
      const key = `${el.stepId}:${el.content}`;
      const exists = prev.some((s) => `${s.stepId}:${s.content}` === key);
      return exists
        ? prev.filter((s) => `${s.stepId}:${s.content}` !== key)
        : [...prev, el];
    });
  }, []);

  const handleElementsSelect = useCallback(
    (els: SelectedElement[]) => {
      setSelections(els);
      if (mode === "voice") toggleMode();
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
    [mode, toggleMode]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    sendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestion = (text: string) => {
    sendMessage(text);
  };

  const voiceOrbState: "idle" | "listening" | "processing" | "speaking" =
    isRecording
      ? "listening"
      : isProcessing
        ? "processing"
        : isSpeaking
          ? "speaking"
          : "idle";

  return (
    <div className="flex h-[calc(100dvh-64px)] relative">
      {messages.length === 0 && <div className="absolute inset-0 pointer-events-none" />}

      {/* Chat column */}
      <div
        className={`flex flex-col transition-all duration-300 relative z-10 ${
          hasWhiteboard ? "w-1/2 border-r border-border/50" : "mx-auto w-full max-w-2xl"
        }`}
      >
        {/* Scrollable messages area */}
        <div
          ref={scrollRef}
          onScroll={checkNearBottom}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {/* Welcome state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-5">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-[0_0_30px_rgba(var(--primary),0.2)]"
              >
                <GraduationCap className="h-10 w-10 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                <div className="absolute -right-2 -top-2">
                  <Sparkles className="h-5 w-5 text-athena-amber fill-athena-amber drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="text-center space-y-2"
              >
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                  SAT Prep Mentor
                </h1>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                  I&apos;m your personal SAT coach. I know your progress, your
                  strengths, and where you can improve.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap justify-center gap-2 mt-2 max-w-md"
              >
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 + i * 0.07 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSuggestion(s)}
                    className="rounded-full border border-border/60 bg-card/60 backdrop-blur-sm px-4 py-2 text-sm font-medium text-foreground/80 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground hover:shadow-[0_0_10px_rgba(var(--primary),0.15)] transition-all duration-200"
                  >
                    {s}
                  </motion.button>
                ))}
              </motion.div>
            </div>
          )}

          {/* Messages */}
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <MessageBubble
                  role={msg.role}
                  content={msg.content}
                  isStreaming={msg.isStreaming}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Thinking indicator */}
          <AnimatePresence>
            {isProcessing && !messages.some((m) => m.isStreaming) && (
              <ThinkingIndicator />
            )}
          </AnimatePresence>

          {/* Speaking indicator */}
          {isSpeaking && !isProcessing && (
            <motion.p
              className="text-xs text-muted-foreground px-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Athena is speaking...
            </motion.p>
          )}
        </div>

        {/* Input area */}
        {mode === "text" ? (
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 border-t border-border/50 bg-background/60 backdrop-blur-md p-3"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your mentor anything…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 resize-none min-h-[36px] max-h-[120px] py-2 text-foreground"
              rows={1}
              disabled={isProcessing}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={toggleMode}
              title="Switch to voice mode"
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
                className="h-8 w-8 shrink-0 bg-primary/90 hover:bg-primary shadow-[0_0_10px_rgba(var(--primary),0.4)] disabled:opacity-40 disabled:shadow-none"
                disabled={!input.trim() || isProcessing}
              >
                <Send className="h-4 w-4" />
              </Button>
            </motion.div>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-4 border-t border-border/50 bg-background/60 backdrop-blur-md p-6">
            <VoiceOrb
              state={voiceOrbState}
              amplitude={amplitude}
              onTap={isRecording ? stopRecording : startRecording}
              disabled={isProcessing && !isRecording}
            />
            <p className="text-sm text-muted-foreground font-medium">
              {isRecording
                ? "Listening… tap to stop"
                : isProcessing
                  ? "Processing…"
                  : isSpeaking
                    ? "Athena is speaking…"
                    : "Tap to speak"}
            </p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={toggleMode}
            >
              <Keyboard className="h-3.5 w-3.5" />
              Switch to text
            </Button>
          </div>
        )}
      </div>

      {/* Whiteboard panel */}
      <AnimatePresence>
        {hasWhiteboard && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "50%" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col overflow-hidden"
          >
            <WhiteboardToolbar
              state={playerState}
              speed={speed}
              currentStep={currentStepIndex}
              totalSteps={whiteboardSteps.length}
              isStreaming={isWhiteboardStreaming}
              onPlay={play}
              onPause={pause}
              onReplay={replay}
              onSpeedChange={changeSpeed}
            />

            <div className="flex-1 min-h-0">
              <WhiteboardCanvas
                steps={whiteboardSteps}
                visibleStepIds={visibleStepIds}
                currentStepIndex={currentStepIndex}
                stepProgress={stepProgress}
                selections={selections}
                onElementSelect={handleElementSelect}
                onElementToggle={handleElementToggle}
                onElementsSelect={handleElementsSelect}
              />
            </div>

            {whiteboardSteps.length > 1 && (
              <WhiteboardTimeline
                totalSteps={whiteboardSteps.length}
                currentStep={currentStepIndex}
                visibleStepIds={visibleStepIds}
                stepIds={whiteboardSteps.map((s) => s.id)}
                onSeek={seekToStep}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useState } from "react";
import { WhiteboardCanvas } from "@/components/whiteboard/whiteboard-canvas";
import type { WhiteboardStep } from "@/types/whiteboard";
import { Button } from "@/components/ui/button";

const TEST_STEPS: WhiteboardStep[] = [
  {
    id: 1,
    narration: "Let's look at a coordinate plane with a sketchy feel.",
    displayText: "Sketchy Coordinate Plane",
    delayMs: 0,
    durationMs: 1000,
    action: {
      type: "coordinate_plane",
      xRange: [-5, 5],
      yRange: [-5, 5],
      elements: [],
      showGrid: true,
      axisLabels: { x: "X Axis", y: "Y Axis" }
    }
  },
  {
    id: 2,
    narration: "Now, let's draw a basketball!",
    displayText: "WbIllustration: Basketball",
    delayMs: 1000,
    durationMs: 2000,
    action: {
      type: "illustration",
      illustrationType: "basketball",
      width: 150,
      height: 150,
      position: { x: 50, y: 50 }
    }
  },
  {
    id: 3,
    narration: "How about a glowing rocket?",
    displayText: "WbIllustration: Rocket",
    delayMs: 500,
    durationMs: 2000,
    action: {
      type: "illustration",
      illustrationType: "rocket",
      width: 120,
      height: 120,
      position: { x: 250, y: 50 }
    }
  },
  {
    id: 4,
    narration: "And a trophy for your hard work.",
    displayText: "WbIllustration: Trophy",
    delayMs: 500,
    durationMs: 2000,
    action: {
      type: "illustration",
      illustrationType: "trophy",
      width: 130,
      height: 130,
      position: { x: 450, y: 50 }
    }
  },
  {
    id: 5,
    narration: "Check out this hand-drawn geometry shape.",
    displayText: "Sketchy Geometry",
    delayMs: 500,
    durationMs: 1500,
    action: {
      type: "geometry",
      figures: [
        { type: "polygon", vertices: [{x: 10, y: 30}, {x: 20, y: 25}, {x: 30, y: 35}], style: { strokeColor: "var(--athena-amber)", fillColor: "rgba(251,191,36,0.1)" } }
      ]
    }
  }
];

export default function TestWhiteboardPage() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Whiteboard Enhancement Lab</h1>
            <p className="text-muted-foreground">Testing Illustrations, Sketchy Mode, and Magic Pen</p>
          </div>
          <Button onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? "Reset" : "Run Test Sequence"}
          </Button>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-3xl border-4 border-white/5 bg-black/40 shadow-2xl backdrop-blur-sm">
          {isPlaying ? (
            <WhiteboardCanvas 
              steps={TEST_STEPS} 
              visibleStepIds={new Set(TEST_STEPS.map(s => s.id))} 
              currentStepIndex={TEST_STEPS.length - 1}
              stepProgress={1}
              onComplete={() => setIsPlaying(false)} 
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/20">
              <p className="text-xl font-bold uppercase tracking-widest italic">Canvas Idle</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-card p-4">
            <h3 className="font-bold text-athena-amber">1. Magic Pen</h3>
            <p className="text-xs text-muted-foreground">The glowing tip follows the path of every illustration and shape.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-card p-4">
            <h3 className="font-bold text-athena-amber">2. Step Bursts</h3>
            <p className="text-xs text-muted-foreground">Particle explosions trigger when a drawing completes.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-card p-4">
            <h3 className="font-bold text-athena-amber">3. Sketchy Filter</h3>
            <p className="text-xs text-muted-foreground">Coordinates and geometry have a hand-drawn displacement effect.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

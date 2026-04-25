"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, Target, RotateCcw, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

type Viewport = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

type DragPoint = {
  id: "A" | "B";
  x: number;
  y: number;
};

type FunctionMode = "linear" | "quadratic" | "cubic" | "sin" | "cos" | "tan" | "parametric";
type DrawingPreset = "basketball" | "flower" | "geometry";

type Primitive =
  | { type: "circle"; cx: number; cy: number; r: number; stroke: string; fill?: string; strokeWidth?: number }
  | { type: "line"; x1: number; y1: number; x2: number; y2: number; stroke: string; strokeWidth?: number }
  | { type: "path"; d: string; stroke: string; fill?: string; strokeWidth?: number }
  | { type: "polygon"; points: string; stroke: string; fill?: string; strokeWidth?: number };

const DEFAULT_VIEW: Viewport = { xMin: -12, xMax: 12, yMin: -8, yMax: 8 };
const CANVAS_W = 920;
const CANVAS_H = 520;
const AXIS_PAD = 40;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toSvgX(x: number, view: Viewport) {
  const w = CANVAS_W - AXIS_PAD * 2;
  return AXIS_PAD + ((x - view.xMin) / (view.xMax - view.xMin)) * w;
}

function toSvgY(y: number, view: Viewport) {
  const h = CANVAS_H - AXIS_PAD * 2;
  return AXIS_PAD + ((view.yMax - y) / (view.yMax - view.yMin)) * h;
}

function fromSvgX(x: number, view: Viewport) {
  const w = CANVAS_W - AXIS_PAD * 2;
  return view.xMin + ((x - AXIS_PAD) / w) * (view.xMax - view.xMin);
}

function fromSvgY(y: number, view: Viewport) {
  const h = CANVAS_H - AXIS_PAD * 2;
  return view.yMax - ((y - AXIS_PAD) / h) * (view.yMax - view.yMin);
}

function formatNum(v: number) {
  if (!Number.isFinite(v)) return "--";
  return Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2).replace(/\.00$/, "");
}

function niceStep(span: number) {
  const rough = span / 10;
  const mag = Math.pow(10, Math.floor(Math.log10(rough || 1)));
  const residual = rough / mag;
  if (residual < 1.5) return 1 * mag;
  if (residual < 3.5) return 2 * mag;
  if (residual < 7.5) return 5 * mag;
  return 10 * mag;
}

function sampleFunction(mode: FunctionMode, x: number, coeffs: Record<string, number>) {
  const { a, b, c, d, amp, freq, phase, shift } = coeffs;
  switch (mode) {
    case "linear":
      return a * x + b;
    case "quadratic":
      return a * x * x + b * x + c;
    case "cubic":
      return a * x * x * x + b * x * x + c * x + d;
    case "sin":
      return amp * Math.sin(freq * x + phase) + shift;
    case "cos":
      return amp * Math.cos(freq * x + phase) + shift;
    case "tan":
      return amp * Math.tan(freq * x + phase) + shift;
    default:
      return 0;
  }
}

function buildPolylinePath(points: Array<[number, number]>) {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i += 1) {
    d += ` L ${points[i][0]} ${points[i][1]}`;
  }
  return d;
}

function buildDrawingPrimitives(preset: DrawingPreset): Primitive[] {
  if (preset === "basketball") {
    return [
      { type: "circle", cx: 0, cy: 0, r: 120, stroke: "#ea580c", fill: "rgba(251,146,60,0.2)", strokeWidth: 8 },
      { type: "path", d: "M -120 0 A 120 120 0 0 0 120 0", stroke: "#7c2d12", strokeWidth: 6 },
      { type: "path", d: "M -120 0 A 120 120 0 0 1 120 0", stroke: "#7c2d12", strokeWidth: 6 },
      { type: "path", d: "M 0 -120 C -40 -80 -40 80 0 120", stroke: "#7c2d12", strokeWidth: 6 },
      { type: "path", d: "M 0 -120 C 40 -80 40 80 0 120", stroke: "#7c2d12", strokeWidth: 6 },
    ];
  }

  if (preset === "flower") {
    return [
      { type: "circle", cx: 0, cy: 0, r: 24, stroke: "#b45309", fill: "#fde047", strokeWidth: 4 },
      { type: "line", x1: 0, y1: 24, x2: 0, y2: 170, stroke: "#16a34a", strokeWidth: 6 },
      { type: "path", d: "M 0 90 C -50 65 -75 125 -20 135", stroke: "#16a34a", fill: "rgba(74,222,128,0.4)", strokeWidth: 3 },
      { type: "path", d: "M 0 110 C 50 85 75 145 20 155", stroke: "#16a34a", fill: "rgba(74,222,128,0.4)", strokeWidth: 3 },
      ...Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const x = Math.cos(angle) * 56;
        const y = Math.sin(angle) * 56;
        return { type: "circle" as const, cx: x, cy: y, r: 30, stroke: "#ec4899", fill: "rgba(244,114,182,0.45)", strokeWidth: 3 };
      }),
    ];
  }

  return [
    { type: "polygon", points: "0,-120 112,70 -112,70", stroke: "#0f766e", fill: "rgba(45,212,191,0.25)", strokeWidth: 5 },
    { type: "circle", cx: 0, cy: 5, r: 62, stroke: "#0284c7", fill: "rgba(56,189,248,0.2)", strokeWidth: 4 },
    { type: "line", x1: -112, y1: 70, x2: 112, y2: 70, stroke: "#334155", strokeWidth: 3 },
    { type: "line", x1: 0, y1: -120, x2: 0, y2: 70, stroke: "#334155", strokeWidth: 3 },
  ];
}

export function InteractiveLearningCanvas() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [functionMode, setFunctionMode] = useState<FunctionMode>("linear");
  const [drawingPreset, setDrawingPreset] = useState<DrawingPreset>("basketball");
  const [view, setView] = useState<Viewport>(DEFAULT_VIEW);
  const [isPanning, setIsPanning] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; svgX: number; svgY: number } | null>(null);
  const [draggingId, setDraggingId] = useState<DragPoint["id"] | null>(null);
  const [challengeScore, setChallengeScore] = useState(0);
  const [challengeSolved, setChallengeSolved] = useState(false);
  const [sparkles, setSparkles] = useState(false);
  const panStart = useRef<{ clientX: number; clientY: number; view: Viewport } | null>(null);

  const [coeffs, setCoeffs] = useState<Record<string, number>>({
    a: 1,
    b: 0,
    c: 0,
    d: 0,
    amp: 1,
    freq: 1,
    phase: 0,
    shift: 0,
    tFreqX: 3,
    tFreqY: 2,
    tPhaseX: 0,
    tPhaseY: Math.PI / 4,
    tScaleX: 4,
    tScaleY: 3,
  });

  const [points, setPoints] = useState<DragPoint[]>([
    { id: "A", x: -2, y: -1 },
    { id: "B", x: 3, y: 2 },
  ]);

  const targetSlope = 1.5;

  const slope = useMemo(() => {
    const pA = points[0];
    const pB = points[1];
    const dx = pB.x - pA.x;
    if (Math.abs(dx) < 1e-6) return 0;
    return (pB.y - pA.y) / dx;
  }, [points]);

  const intercept = useMemo(() => {
    const pA = points[0];
    return pA.y - slope * pA.x;
  }, [points, slope]);

  useEffect(() => {
    if (functionMode === "linear") {
      Promise.resolve().then(() => {
        setCoeffs((prev) => ({ ...prev, a: slope, b: intercept }));
      });
    }
  }, [slope, intercept, functionMode]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setRevealProgress((v) => {
        if (v >= 1) return 1;
        return Math.min(1, v + 0.025);
      });
    }, 16);
    return () => window.clearInterval(id);
  }, [isPlaying]);

  useEffect(() => {
    const slopeDelta = Math.abs(slope - targetSlope);
    const solved = slopeDelta < 0.08;
    if (solved && !challengeSolved) {
      Promise.resolve().then(() => {
        setChallengeScore((v) => v + 120);
        setChallengeSolved(true);
        setSparkles(true);
        window.setTimeout(() => setSparkles(false), 1200);
      });
    }
    if (!solved && challengeSolved) {
      Promise.resolve().then(() => setChallengeSolved(false));
    }
  }, [slope, challengeSolved]);

  const xTicks = useMemo(() => {
    const step = niceStep(view.xMax - view.xMin);
    const ticks: number[] = [];
    for (let t = Math.ceil(view.xMin / step) * step; t <= view.xMax; t += step) {
      ticks.push(Number(t.toFixed(6)));
    }
    return ticks;
  }, [view]);

  const yTicks = useMemo(() => {
    const step = niceStep(view.yMax - view.yMin);
    const ticks: number[] = [];
    for (let t = Math.ceil(view.yMin / step) * step; t <= view.yMax; t += step) {
      ticks.push(Number(t.toFixed(6)));
    }
    return ticks;
  }, [view]);

  const graphPaths = useMemo(() => {
    const segments: string[] = [];
    const steps = 380;
    const xSpan = view.xMax - view.xMin;
    const start = view.xMin;
    const yLimit = (view.yMax - view.yMin) * 1.4;

    if (functionMode === "parametric") {
      const pts: Array<[number, number]> = [];
      for (let i = 0; i <= steps; i += 1) {
        const t = (i / steps) * Math.PI * 2;
        const x = coeffs.tScaleX * Math.sin(coeffs.tFreqX * t + coeffs.tPhaseX);
        const y = coeffs.tScaleY * Math.cos(coeffs.tFreqY * t + coeffs.tPhaseY);
        pts.push([toSvgX(x, view), toSvgY(y, view)]);
      }
      segments.push(buildPolylinePath(pts));
      return segments;
    }

    let active: Array<[number, number]> = [];
    for (let i = 0; i <= steps; i += 1) {
      const x = start + (i / steps) * xSpan;
      const y = sampleFunction(functionMode, x, coeffs);
      const isOut = !Number.isFinite(y) || Math.abs(y) > yLimit;

      if (isOut) {
        if (active.length > 1) segments.push(buildPolylinePath(active));
        active = [];
        continue;
      }

      active.push([toSvgX(x, view), toSvgY(y, view)]);
    }

    if (active.length > 1) {
      segments.push(buildPolylinePath(active));
    }

    return segments;
  }, [view, functionMode, coeffs]);

  const specialPoints = useMemo(() => {
    const points: Array<{ x: number; y: number; label: string }> = [];

    if (functionMode === "linear") {
      if (Math.abs(coeffs.a) > 1e-6) {
        const root = -coeffs.b / coeffs.a;
        if (root >= view.xMin && root <= view.xMax) {
          points.push({ x: root, y: 0, label: "x-int" });
        }
      }
      if (0 >= view.yMin && 0 <= view.yMax) {
        points.push({ x: 0, y: coeffs.b, label: "y-int" });
      }
    }

    if (functionMode === "quadratic") {
      const discriminant = coeffs.b * coeffs.b - 4 * coeffs.a * coeffs.c;
      if (Math.abs(coeffs.a) > 1e-6 && discriminant >= 0) {
        const sqrtD = Math.sqrt(discriminant);
        const r1 = (-coeffs.b + sqrtD) / (2 * coeffs.a);
        const r2 = (-coeffs.b - sqrtD) / (2 * coeffs.a);
        [r1, r2].forEach((root, idx) => {
          if (root >= view.xMin && root <= view.xMax) {
            points.push({ x: root, y: 0, label: idx === 0 ? "root 1" : "root 2" });
          }
        });
      }
    }

    return points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  }, [coeffs, functionMode, view]);

  const drawingPrimitives = useMemo(() => buildDrawingPrimitives(drawingPreset), [drawingPreset]);

  const handleWheel = useCallback((event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = event.clientX - rect.left;
    const svgY = event.clientY - rect.top;
    const dataX = fromSvgX(svgX, view);
    const dataY = fromSvgY(svgY, view);

    const zoom = event.deltaY < 0 ? 0.9 : 1.1;
    setView((prev) => {
      const nextSpanX = clamp((prev.xMax - prev.xMin) * zoom, 4, 100);
      const nextSpanY = clamp((prev.yMax - prev.yMin) * zoom, 4, 100);
      const xRatio = (dataX - prev.xMin) / (prev.xMax - prev.xMin);
      const yRatio = (dataY - prev.yMin) / (prev.yMax - prev.yMin);

      const xMin = dataX - xRatio * nextSpanX;
      const yMin = dataY - yRatio * nextSpanY;
      return {
        xMin,
        xMax: xMin + nextSpanX,
        yMin,
        yMax: yMin + nextSpanY,
      };
    });
  }, [view]);

  const handlePointerDown = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (draggingId) return;
    setIsPanning(true);
    panStart.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      view,
    };
  }, [draggingId, view]);

  const handlePointerMove = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = event.clientX - rect.left;
    const svgY = event.clientY - rect.top;
    const x = fromSvgX(svgX, view);
    const y = fromSvgY(svgY, view);
    setHoverPoint({ x, y, svgX, svgY });

    if (draggingId) {
      setPoints((prev) => prev.map((p) => (p.id === draggingId ? { ...p, x, y } : p)));
      return;
    }

    if (!isPanning || !panStart.current) return;
    const dx = event.clientX - panStart.current.clientX;
    const dy = event.clientY - panStart.current.clientY;

    const xDataDelta = (dx / (CANVAS_W - AXIS_PAD * 2)) * (panStart.current.view.xMax - panStart.current.view.xMin);
    const yDataDelta = (dy / (CANVAS_H - AXIS_PAD * 2)) * (panStart.current.view.yMax - panStart.current.view.yMin);

    setView({
      xMin: panStart.current.view.xMin - xDataDelta,
      xMax: panStart.current.view.xMax - xDataDelta,
      yMin: panStart.current.view.yMin + yDataDelta,
      yMax: panStart.current.view.yMax + yDataDelta,
    });
  }, [view, draggingId, isPanning]);

  const stopInteractions = useCallback(() => {
    setDraggingId(null);
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const renderPrimitive = (primitive: Primitive, index: number) => {
    const common = {
      key: `primitive-${index}`,
      stroke: primitive.stroke,
      strokeWidth: primitive.strokeWidth ?? 3,
      fill: "fill" in primitive ? primitive.fill ?? "none" : "none",
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
    };

    if (primitive.type === "circle") {
      return <motion.circle {...common} cx={primitive.cx} cy={primitive.cy} r={primitive.r} initial={{ pathLength: 0 }} animate={{ pathLength: revealProgress }} />;
    }

    if (primitive.type === "line") {
      return <motion.line {...common} x1={primitive.x1} y1={primitive.y1} x2={primitive.x2} y2={primitive.y2} initial={{ pathLength: 0 }} animate={{ pathLength: revealProgress }} />;
    }

    if (primitive.type === "path") {
      return <motion.path {...common} d={primitive.d} initial={{ pathLength: 0 }} animate={{ pathLength: revealProgress }} />;
    }

    return <motion.polygon {...common} points={primitive.points} initial={{ pathLength: 0 }} animate={{ pathLength: revealProgress }} />;
  };

  const resetView = () => {
    setView(DEFAULT_VIEW);
    setRevealProgress(0);
    setIsPlaying(true);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-sky-100/60 via-white/80 to-emerald-100/50 p-4 shadow-[0_12px_40px_rgba(14,116,144,0.18)] dark:border-white/20 dark:from-slate-900/70 dark:via-slate-900/80 dark:to-cyan-900/30">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />

      <div className="relative z-10 grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-border bg-background/60 p-3 backdrop-blur-md dark:border-white/30">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-border bg-background/80 p-1 text-xs">
              {(["linear", "quadratic", "cubic", "sin", "cos", "tan", "parametric"] as FunctionMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setFunctionMode(mode);
                    setRevealProgress(0);
                  }}
                  className={cn(
                    "rounded-md px-2 py-1 font-semibold capitalize transition",
                    functionMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                  aria-label={`Switch to ${mode} graph mode`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <button onClick={() => setIsPlaying((p) => !p)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/80 px-2 py-1 text-xs font-semibold">
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} Draw
            </button>
            <button onClick={resetView} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/80 px-2 py-1 text-xs font-semibold">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>

          <svg
            ref={svgRef}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            className="h-auto w-full touch-none rounded-xl border border-border/70 bg-[radial-gradient(circle_at_30%_0%,rgba(125,211,252,0.17),transparent_40%),radial-gradient(circle_at_95%_100%,rgba(52,211,153,0.17),transparent_35%)]"
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopInteractions}
            onPointerLeave={() => {
              stopInteractions();
              setHoverPoint(null);
            }}
            role="img"
            aria-label="Interactive math graph canvas with zoom, pan, and draggable points"
          >
            <defs>
              <linearGradient id="curveStroke" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#0891b2" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
              <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {xTicks.map((t) => {
              const sx = toSvgX(t, view);
              return <line key={`x-${t}`} x1={sx} x2={sx} y1={AXIS_PAD} y2={CANVAS_H - AXIS_PAD} stroke="rgba(100,116,139,0.25)" strokeWidth="1" />;
            })}
            {yTicks.map((t) => {
              const sy = toSvgY(t, view);
              return <line key={`y-${t}`} y1={sy} y2={sy} x1={AXIS_PAD} x2={CANVAS_W - AXIS_PAD} stroke="rgba(100,116,139,0.25)" strokeWidth="1" />;
            })}

            <line
              x1={toSvgX(0, view)}
              x2={toSvgX(0, view)}
              y1={AXIS_PAD}
              y2={CANVAS_H - AXIS_PAD}
              stroke="rgba(15,23,42,0.8)"
              strokeWidth="2"
            />
            <line
              x1={AXIS_PAD}
              x2={CANVAS_W - AXIS_PAD}
              y1={toSvgY(0, view)}
              y2={toSvgY(0, view)}
              stroke="rgba(15,23,42,0.8)"
              strokeWidth="2"
            />

            {graphPaths.map((path, i) => (
              <motion.path
                key={`path-${i}`}
                d={path}
                fill="none"
                stroke="url(#curveStroke)"
                strokeWidth="3"
                filter="url(#softGlow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: revealProgress }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              />
            ))}

            {functionMode === "linear" &&
              points.map((p) => {
                const cx = toSvgX(p.x, view);
                const cy = toSvgY(p.y, view);
                return (
                  <g key={p.id}>
                    <motion.circle
                      cx={cx}
                      cy={cy}
                      r={10}
                      fill="rgba(255,255,255,0.95)"
                      stroke="#0ea5e9"
                      strokeWidth="3"
                      className="cursor-grab"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        setDraggingId(p.id);
                      }}
                      whileHover={{ scale: 1.08 }}
                    />
                    <text x={cx + 13} y={cy - 12} className="fill-sky-700 text-[12px] font-bold">
                      {p.id}
                    </text>
                  </g>
                );
              })}

            {hoverPoint && (
              <g pointerEvents="none">
                <circle cx={hoverPoint.svgX} cy={hoverPoint.svgY} r={3.5} fill="#0ea5e9" />
                <rect x={hoverPoint.svgX + 12} y={hoverPoint.svgY - 28} width={94} height={24} rx={6} fill="rgba(15,23,42,0.86)" />
                <text x={hoverPoint.svgX + 18} y={hoverPoint.svgY - 12} className="fill-white text-[11px]">
                  ({formatNum(hoverPoint.x)}, {formatNum(hoverPoint.y)})
                </text>
              </g>
            )}

            {specialPoints.map((point, idx) => (
              <g key={`special-${idx}`} pointerEvents="none">
                <circle
                  cx={toSvgX(point.x, view)}
                  cy={toSvgY(point.y, view)}
                  r={6.5}
                  fill="rgba(14,165,233,0.16)"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                />
                <text
                  x={toSvgX(point.x, view) + 9}
                  y={toSvgY(point.y, view) - 9}
                  className="fill-sky-700 text-[11px] font-semibold"
                >
                  {point.label}
                </text>
              </g>
            ))}
          </svg>

          <p className="mt-2 text-xs text-muted-foreground">
            Drag to pan. Scroll to zoom. Drag points A/B in linear mode to change slope in real time.
          </p>
        </div>

        <div className="grid gap-3">
          <div className="rounded-xl border border-border bg-background/70 p-3 backdrop-blur-md dark:border-white/30">
            <div className="mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-sky-600" />
              <p className="text-sm font-semibold">Challenge: Hit The Target Slope</p>
            </div>
            <p className="text-xs text-muted-foreground">Move point B until the line matches m = {targetSlope}.</p>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/60 p-2 text-xs">
              <span>Current slope</span>
              <span className="font-bold">{formatNum(slope)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-muted/60 p-2 text-xs">
              <span>Score</span>
              <span className="font-bold">{challengeScore}</span>
            </div>
            <div className="mt-2 rounded-lg border border-sky-300/30 bg-sky-100/40 p-2 text-[11px] text-sky-800 dark:bg-sky-400/10 dark:text-sky-300">
              Watch x-intercepts and roots appear as your coefficients move.
            </div>
            <AnimatePresence>
              {challengeSolved && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                >
                  <Trophy className="h-3.5 w-3.5" /> Perfect alignment bonus
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="rounded-xl border border-border bg-background/70 p-3 backdrop-blur-md dark:border-white/30">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-fuchsia-600" />
              <p className="text-sm font-semibold">Dynamic Drawing Engine</p>
            </div>
            <div className="mb-3 inline-flex rounded-lg border border-border bg-background/80 p-1 text-xs">
              {(["basketball", "flower", "geometry"] as DrawingPreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setDrawingPreset(preset);
                    setRevealProgress(0);
                    setIsPlaying(true);
                  }}
                  className={cn(
                    "rounded-md px-2 py-1 font-semibold capitalize",
                    drawingPreset === preset ? "bg-fuchsia-600 text-white" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
            <svg viewBox="-180 -180 360 380" className="h-[190px] w-full rounded-lg border border-border/70 bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.12),transparent_50%)]">
              {drawingPrimitives.map(renderPrimitive)}
            </svg>
            <p className="mt-2 text-xs text-muted-foreground">
              Primitive-based recipes can map future prompts like &quot;draw a basketball using circles&quot; into reusable vector instructions.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background/70 p-3 backdrop-blur-md dark:border-white/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Function Controls</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {(functionMode === "linear" || functionMode === "quadratic" || functionMode === "cubic") && (
                <>
                  {["a", "b", "c", "d"].map((key) => (
                    <label key={key} className="space-y-1">
                      <span className="font-medium">{key.toUpperCase()}</span>
                      <input
                        type="range"
                        min={-5}
                        max={5}
                        step={0.1}
                        value={coeffs[key] ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCoeffs((prev) => ({ ...prev, [key]: val }));
                          setRevealProgress(0);
                        }}
                        className="w-full"
                        aria-label={`Adjust coefficient ${key}`}
                      />
                    </label>
                  ))}
                </>
              )}
              {(functionMode === "sin" || functionMode === "cos" || functionMode === "tan") && (
                <>
                  {["amp", "freq", "phase", "shift"].map((key) => (
                    <label key={key} className="space-y-1">
                      <span className="font-medium capitalize">{key}</span>
                      <input
                        type="range"
                        min={key === "freq" ? 0.2 : -6}
                        max={key === "freq" ? 4 : 6}
                        step={0.1}
                        value={coeffs[key] ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCoeffs((prev) => ({ ...prev, [key]: val }));
                          setRevealProgress(0);
                        }}
                        className="w-full"
                        aria-label={`Adjust ${key}`}
                      />
                    </label>
                  ))}
                </>
              )}
              {functionMode === "parametric" && (
                <>
                  {["tFreqX", "tFreqY", "tScaleX", "tScaleY"].map((key) => (
                    <label key={key} className="space-y-1">
                      <span className="font-medium">{key}</span>
                      <input
                        type="range"
                        min={1}
                        max={8}
                        step={0.1}
                        value={coeffs[key] ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCoeffs((prev) => ({ ...prev, [key]: val }));
                          setRevealProgress(0);
                        }}
                        className="w-full"
                        aria-label={`Adjust ${key}`}
                      />
                    </label>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {sparkles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            {Array.from({ length: 16 }).map((_, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.3, 1, 0.2],
                  x: Math.cos((idx / 16) * Math.PI * 2) * 180,
                  y: Math.sin((idx / 16) * Math.PI * 2) * 140,
                }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full bg-amber-300"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

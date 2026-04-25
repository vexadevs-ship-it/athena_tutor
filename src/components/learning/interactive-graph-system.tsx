"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Undo2, Redo2, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoordinatePlaneAction } from "@/types/whiteboard";

type GraphMode = "linear" | "quadratic" | "sin" | "cos";
type ToolMode = "none" | "point" | "line" | "freehand";

type Viewport = { xMin: number; xMax: number; yMin: number; yMax: number };
type ControlPoint = { id: string; x: number; y: number };
type DrawPoint = { x: number; y: number };
type OverlayShape =
  | { type: "point"; x: number; y: number }
  | { type: "line"; from: DrawPoint; to: DrawPoint }
  | { type: "freehand"; points: DrawPoint[] };

type GraphState = {
  mode: GraphMode;
  equation: string;
  coeffs: { a: number; b: number; c: number; amp: number; freq: number; phase: number; shift: number };
  rotateDeg: number;
  viewport: Viewport;
  overlays: OverlayShape[];
  points: ControlPoint[];
};

const W = 920;
const H = 520;
const PAD = 44;
const DEFAULT_VIEW: Viewport = { xMin: -10, xMax: 10, yMin: -8, yMax: 8 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toSvgX(x: number, view: Viewport) {
  return PAD + ((x - view.xMin) / (view.xMax - view.xMin)) * (W - PAD * 2);
}

function toSvgY(y: number, view: Viewport) {
  return PAD + ((view.yMax - y) / (view.yMax - view.yMin)) * (H - PAD * 2);
}

function toGraphX(svgX: number, view: Viewport) {
  return view.xMin + ((svgX - PAD) / (W - PAD * 2)) * (view.xMax - view.xMin);
}

function toGraphY(svgY: number, view: Viewport) {
  return view.yMax - ((svgY - PAD) / (H - PAD * 2)) * (view.yMax - view.yMin);
}

function formatNum(value: number, p = 2) {
  return Number(value.toFixed(p));
}

function toEquation(mode: GraphMode, coeffs: GraphState["coeffs"]) {
  if (mode === "linear") return `y = ${formatNum(coeffs.a)}x + ${formatNum(coeffs.b)}`;
  if (mode === "quadratic") return `y = ${formatNum(coeffs.a)}x^2 + ${formatNum(coeffs.b)}x + ${formatNum(coeffs.c)}`;
  if (mode === "sin") return `y = ${formatNum(coeffs.amp)}sin(${formatNum(coeffs.freq)}x + ${formatNum(coeffs.phase)}) + ${formatNum(coeffs.shift)}`;
  return `y = ${formatNum(coeffs.amp)}cos(${formatNum(coeffs.freq)}x + ${formatNum(coeffs.phase)}) + ${formatNum(coeffs.shift)}`;
}

function parseEquation(input: string, fallbackMode: GraphMode, prev: GraphState["coeffs"]) {
  const clean = input.replace(/\s+/g, "");

  const linear = /^y=([+-]?\d*\.?\d*)x([+-]\d*\.?\d+)?$/i.exec(clean);
  if (linear) {
    const a = linear[1] === "" || linear[1] === "+" ? 1 : linear[1] === "-" ? -1 : Number(linear[1]);
    const b = linear[2] ? Number(linear[2]) : 0;
    return { mode: "linear" as GraphMode, coeffs: { ...prev, a, b }, valid: true };
  }

  const quad = /^y=([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*)x([+-]\d*\.?\d+)?$/i.exec(clean);
  if (quad) {
    const a = quad[1] === "" || quad[1] === "+" ? 1 : quad[1] === "-" ? -1 : Number(quad[1]);
    const b = quad[2] === "" || quad[2] === "+" ? 1 : quad[2] === "-" ? -1 : Number(quad[2]);
    const c = quad[3] ? Number(quad[3]) : 0;
    return { mode: "quadratic" as GraphMode, coeffs: { ...prev, a, b, c }, valid: true };
  }

  const trig = /^y=([+-]?\d*\.?\d*)?(sin|cos)\(([+-]?\d*\.?\d*)x([+-]\d*\.?\d+)?\)([+-]\d*\.?\d+)?$/i.exec(clean);
  if (trig) {
    const amp = trig[1] === undefined || trig[1] === "" || trig[1] === "+" ? 1 : trig[1] === "-" ? -1 : Number(trig[1]);
    const mode = trig[2].toLowerCase() as GraphMode;
    const freq = trig[3] === "" || trig[3] === "+" ? 1 : trig[3] === "-" ? -1 : Number(trig[3]);
    const phase = trig[4] ? Number(trig[4]) : 0;
    const shift = trig[5] ? Number(trig[5]) : 0;
    return { mode, coeffs: { ...prev, amp, freq, phase, shift }, valid: true };
  }

  return { mode: fallbackMode, coeffs: prev, valid: false };
}

function evaluate(mode: GraphMode, coeffs: GraphState["coeffs"], x: number) {
  if (mode === "linear") return coeffs.a * x + coeffs.b;
  if (mode === "quadratic") return coeffs.a * x * x + coeffs.b * x + coeffs.c;
  if (mode === "sin") return coeffs.amp * Math.sin(coeffs.freq * x + coeffs.phase) + coeffs.shift;
  return coeffs.amp * Math.cos(coeffs.freq * x + coeffs.phase) + coeffs.shift;
}

function initialState(): GraphState {
  const coeffs = { a: 1, b: 0, c: 0, amp: 1, freq: 1, phase: 0, shift: 0 };
  return {
    mode: "linear",
    equation: toEquation("linear", coeffs),
    coeffs,
    rotateDeg: 0,
    viewport: DEFAULT_VIEW,
    overlays: [],
    points: [
      { id: "P1", x: -2, y: -2 },
      { id: "P2", x: 3, y: 3 },
      { id: "Q", x: 0, y: 0 },
    ],
  };
}

function solveQuadraticCoeffs(p1: DrawPoint, p2: DrawPoint, p3: DrawPoint) {
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;
  const { x: x3, y: y3 } = p3;
  const d = (x1 - x2) * (x1 - x3) * (x2 - x3);
  if (Math.abs(d) < 1e-8) return null;
  const a = (x3 * (y2 - y1) + x2 * (y1 - y3) + x1 * (y3 - y2)) / d;
  const b = (x3 * x3 * (y1 - y2) + x2 * x2 * (y3 - y1) + x1 * x1 * (y2 - y3)) / d;
  const c =
    (x2 * x3 * (x2 - x3) * y1 +
      x3 * x1 * (x3 - x1) * y2 +
      x1 * x2 * (x1 - x2) * y3) /
    d;
  return { a, b, c };
}

function seedFromPlane(plane: CoordinatePlaneAction): GraphState {
  const base = initialState();
  const points = plane.elements.flatMap((el) => (el.type === "point" ? [{ x: el.at[0], y: el.at[1], id: el.label || `P${Math.random()}` }] : []));
  const fn = plane.elements.find((el) => el.type === "function");
  if (!fn || fn.type !== "function" || fn.points.length < 2) {
    return {
      ...base,
      viewport: {
        xMin: plane.xRange[0],
        xMax: plane.xRange[1],
        yMin: plane.yRange[0],
        yMax: plane.yRange[1],
      },
      points:
        points.length >= 2
          ? [
              { id: points[0].id, x: points[0].x, y: points[0].y },
              { id: points[1].id, x: points[1].x, y: points[1].y },
              { id: "Q", x: 0, y: 0 },
            ]
          : base.points,
    };
  }

  const data = fn.points.map(([x, y]) => ({ x, y }));
  const pFirst = data[0];
  const pLast = data[data.length - 1];
  const dx = pLast.x - pFirst.x || 1e-6;
  const slope = (pLast.y - pFirst.y) / dx;
  const intercept = pFirst.y - slope * pFirst.x;
  const linearErr = data.reduce((acc, p) => acc + Math.abs(p.y - (slope * p.x + intercept)), 0) / data.length;

  let mode: GraphMode = "linear";
  let coeffs = { ...base.coeffs, a: slope, b: intercept };

  if (linearErr > 0.35 && data.length >= 3) {
    const mid = data[Math.floor(data.length / 2)];
    const solved = solveQuadraticCoeffs(pFirst, mid, pLast);
    if (solved) {
      mode = "quadratic";
      coeffs = { ...coeffs, a: solved.a, b: solved.b, c: solved.c };
    }
  }

  const equation = toEquation(mode, coeffs);
  return {
    ...base,
    mode,
    coeffs,
    equation,
    viewport: {
      xMin: plane.xRange[0],
      xMax: plane.xRange[1],
      yMin: plane.yRange[0],
      yMax: plane.yRange[1],
    },
    points:
      data.length >= 2
        ? [
            { id: "P1", x: data[0].x, y: data[0].y },
            { id: "P2", x: data[data.length - 1].x, y: data[data.length - 1].y },
            { id: "Q", x: 0, y: 0 },
          ]
        : base.points,
  };
}

export function InteractiveGraphSystem({
  onXpEarn,
  initialPlane,
}: {
  onXpEarn?: (xp: number, reason: string) => void;
  initialPlane?: CoordinatePlaneAction | null;
}) {
  const [state, setState] = useState<GraphState>(() => (initialPlane ? seedFromPlane(initialPlane) : initialState()));
  const [tool, setTool] = useState<ToolMode>("none");
  const [hover, setHover] = useState<DrawPoint | null>(null);
  const [activePointId, setActivePointId] = useState<string | null>(null);
  const [lineStart, setLineStart] = useState<DrawPoint | null>(null);
  const [freehandBuffer, setFreehandBuffer] = useState<DrawPoint[]>([]);
  const [isPanning, setIsPanning] = useState(false);
  const [equationDraft, setEquationDraft] = useState(state.equation);
  const [parseError, setParseError] = useState<string | null>(null);

  const undoStack = useRef<GraphState[]>([]);
  const redoStack = useRef<GraphState[]>([]);
  const panStart = useRef<{ x: number; y: number; viewport: Viewport } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const commit = useCallback((next: GraphState) => {
    undoStack.current.push(state);
    if (undoStack.current.length > 100) undoStack.current.shift();
    redoStack.current = [];
    setState(next);
  }, [state]);

  const updateState = useCallback((updater: (prev: GraphState) => GraphState, shouldCommit = true) => {
    setState((prev) => {
      const next = updater(prev);
      if (shouldCommit) {
        undoStack.current.push(prev);
        if (undoStack.current.length > 100) undoStack.current.shift();
        redoStack.current = [];
      }
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(state);
    setState(prev);
    setEquationDraft(prev.equation);
  }, [state]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(state);
    setState(next);
    setEquationDraft(next.equation);
  }, [state]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (event: KeyboardEvent) => {
      const ctrl = event.ctrlKey || event.metaKey;
      if (ctrl && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
      if (ctrl && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const curvePaths = useMemo(() => {
    const paths: string[] = [];
    const ptsPerCurve = 520;
    const span = state.viewport.xMax - state.viewport.xMin;
    const yLimit = (state.viewport.yMax - state.viewport.yMin) * 1.6;
    let segment: DrawPoint[] = [];

    for (let i = 0; i <= ptsPerCurve; i += 1) {
      const x = state.viewport.xMin + (i / ptsPerCurve) * span;
      const y = evaluate(state.mode, state.coeffs, x);
      const out = !Number.isFinite(y) || Math.abs(y) > yLimit;
      if (out) {
        if (segment.length > 1) {
          const d = `M ${segment.map((p) => `${toSvgX(p.x, state.viewport)} ${toSvgY(p.y, state.viewport)}`).join(" L ")}`;
          paths.push(d);
        }
        segment = [];
        continue;
      }
      segment.push({ x, y });
    }

    if (segment.length > 1) {
      const d = `M ${segment.map((p) => `${toSvgX(p.x, state.viewport)} ${toSvgY(p.y, state.viewport)}`).join(" L ")}`;
      paths.push(d);
    }

    return paths;
  }, [state.mode, state.coeffs, state.viewport]);

  const ticks = useMemo(() => {
    const create = (min: number, max: number) => {
      const span = max - min;
      const stepRaw = span / 10;
      const mag = 10 ** Math.floor(Math.log10(stepRaw || 1));
      const r = stepRaw / mag;
      const step = (r <= 1.5 ? 1 : r <= 3.5 ? 2 : r <= 7.5 ? 5 : 10) * mag;
      const values: number[] = [];
      for (let v = Math.ceil(min / step) * step; v <= max; v += step) values.push(Number(v.toFixed(6)));
      return values;
    };
    return { x: create(state.viewport.xMin, state.viewport.xMax), y: create(state.viewport.yMin, state.viewport.yMax) };
  }, [state.viewport]);

  const applyEquation = () => {
    const parsed = parseEquation(equationDraft, state.mode, state.coeffs);
    if (!parsed.valid) {
      setParseError("Equation format not recognized. Example: y=2x+1, y=x^2-3x+2, y=2sin(1.2x+0)+1");
      return;
    }

    const next = {
      ...state,
      mode: parsed.mode,
      coeffs: parsed.coeffs,
      equation: toEquation(parsed.mode, parsed.coeffs),
    };
    commit(next);
    setEquationDraft(next.equation);
    setParseError(null);
    onXpEarn?.(5, "Equation tuned");
  };

  const onWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const sx = ((event.clientX - rect.left) / rect.width) * W;
    const sy = ((event.clientY - rect.top) / rect.height) * H;
    const gx = toGraphX(sx, state.viewport);
    const gy = toGraphY(sy, state.viewport);

    const zoom = event.deltaY < 0 ? 0.9 : 1.1;
    updateState((prev) => {
      const spanX = clamp((prev.viewport.xMax - prev.viewport.xMin) * zoom, 4, 120);
      const spanY = clamp((prev.viewport.yMax - prev.viewport.yMin) * zoom, 4, 120);
      const ratioX = (gx - prev.viewport.xMin) / (prev.viewport.xMax - prev.viewport.xMin);
      const ratioY = (gy - prev.viewport.yMin) / (prev.viewport.yMax - prev.viewport.yMin);
      const xMin = gx - ratioX * spanX;
      const yMin = gy - ratioY * spanY;
      return { ...prev, viewport: { xMin, xMax: xMin + spanX, yMin, yMax: yMin + spanY } };
    }, false);
  };

  const fromEvent = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const sx = ((event.clientX - rect.left) / rect.width) * W;
    const sy = ((event.clientY - rect.top) / rect.height) * H;
    return { x: toGraphX(sx, state.viewport), y: toGraphY(sy, state.viewport) };
  };

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    const p = fromEvent(event);

    if (activePointId) return;

    if (tool === "point") {
      updateState((prev) => ({ ...prev, overlays: [...prev.overlays, { type: "point", x: p.x, y: p.y }] }));
      onXpEarn?.(3, "Placed point");
      return;
    }

    if (tool === "line") {
      if (!lineStart) setLineStart(p);
      else {
        updateState((prev) => ({ ...prev, overlays: [...prev.overlays, { type: "line", from: lineStart, to: p }] }));
        setLineStart(null);
        onXpEarn?.(4, "Line drawn");
      }
      return;
    }

    if (tool === "freehand") {
      setFreehandBuffer([p]);
      return;
    }

    setIsPanning(true);
    panStart.current = { x: event.clientX, y: event.clientY, viewport: state.viewport };
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const p = fromEvent(event);
    setHover(p);

    if (activePointId) {
      updateState((prev) => {
        const points = prev.points.map((pt) => (pt.id === activePointId ? { ...pt, x: p.x, y: p.y } : pt));
        let coeffs = prev.coeffs;
        if (prev.mode === "linear") {
          const p1 = points[0];
          const p2 = points[1];
          const dx = p2.x - p1.x || 1e-6;
          const a = (p2.y - p1.y) / dx;
          const b = p1.y - a * p1.x;
          coeffs = { ...coeffs, a, b };
        }
        if (prev.mode === "quadratic") {
          const q = points[2];
          const a = coeffs.a;
          const b = -2 * a * q.x;
          const c = a * q.x * q.x + q.y;
          coeffs = { ...coeffs, b, c };
        }
        return { ...prev, points, coeffs, equation: toEquation(prev.mode, coeffs) };
      }, false);
      return;
    }

    if (tool === "freehand" && freehandBuffer.length > 0) {
      setFreehandBuffer((prev) => [...prev, p]);
      return;
    }

    if (isPanning && panStart.current) {
      const dx = event.clientX - panStart.current.x;
      const dy = event.clientY - panStart.current.y;
      const xDelta = (dx / (W - PAD * 2)) * (panStart.current.viewport.xMax - panStart.current.viewport.xMin);
      const yDelta = (dy / (H - PAD * 2)) * (panStart.current.viewport.yMax - panStart.current.viewport.yMin);
      updateState((prev) => ({
        ...prev,
        viewport: {
          xMin: panStart.current!.viewport.xMin - xDelta,
          xMax: panStart.current!.viewport.xMax - xDelta,
          yMin: panStart.current!.viewport.yMin + yDelta,
          yMax: panStart.current!.viewport.yMax + yDelta,
        },
      }), false);
    }
  };

  const onPointerUp = () => {
    if (tool === "freehand" && freehandBuffer.length > 1) {
      updateState((prev) => ({ ...prev, overlays: [...prev.overlays, { type: "freehand", points: freehandBuffer }] }));
      setFreehandBuffer([]);
      onXpEarn?.(4, "Sketch added");
    }
    setIsPanning(false);
    panStart.current = null;
    setActivePointId(null);
  };

  useEffect(() => {
    Promise.resolve().then(() => setEquationDraft(state.equation));
  }, [state.equation]);

  const reset = () => {
    const next = initialPlane ? seedFromPlane(initialPlane) : initialState();
    setState(next);
    setEquationDraft(next.equation);
    setLineStart(null);
    setFreehandBuffer([]);
    undoStack.current = [];
    redoStack.current = [];
  };

  useEffect(() => {
    if (!initialPlane) return;
    const seeded = seedFromPlane(initialPlane);
    Promise.resolve().then(() => {
      setState(seeded);
      setEquationDraft(seeded.equation);
      undoStack.current = [];
      redoStack.current = [];
    });
  }, [initialPlane]);

  return (
    <div
      ref={rootRef}
      className="flex h-full min-h-[420px] w-full flex-col rounded-2xl border border-white/20 bg-card/65 p-3 backdrop-blur-xl"
      tabIndex={0}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border bg-background/80 p-1 text-xs">
          {(["linear", "quadratic", "sin", "cos"] as GraphMode[]).map((m) => (
            <button
              key={m}
              className={cn("rounded-md px-2 py-1 font-semibold capitalize", state.mode === m ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
              onClick={() => updateState((prev) => {
                const mode = m;
                return { ...prev, mode, equation: toEquation(mode, prev.coeffs) };
              })}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="inline-flex rounded-lg border border-border bg-background/80 p-1 text-xs">
          {(["none", "point", "line", "freehand"] as ToolMode[]).map((t) => (
            <button
              key={t}
              className={cn("rounded-md px-2 py-1 font-semibold capitalize", tool === t ? "bg-emerald-600 text-white" : "hover:bg-muted")}
              onClick={() => {
                setTool(t);
                setLineStart(null);
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <button className="rounded-lg border border-border bg-background/80 px-2 py-1 text-xs" onClick={undo}><Undo2 className="h-3.5 w-3.5" /></button>
        <button className="rounded-lg border border-border bg-background/80 px-2 py-1 text-xs" onClick={redo}><Redo2 className="h-3.5 w-3.5" /></button>
        <button className="rounded-lg border border-border bg-background/80 px-2 py-1 text-xs" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /></button>
        <button className="rounded-lg border border-border bg-background/80 px-2 py-1 text-xs" onClick={() => updateState((p) => ({ ...p, viewport: { ...p.viewport, xMin: p.viewport.xMin * 0.9, xMax: p.viewport.xMax * 0.9, yMin: p.viewport.yMin * 0.9, yMax: p.viewport.yMax * 0.9 } }), false)}><ZoomIn className="h-3.5 w-3.5" /></button>
        <button className="rounded-lg border border-border bg-background/80 px-2 py-1 text-xs" onClick={() => updateState((p) => ({ ...p, viewport: { ...p.viewport, xMin: p.viewport.xMin * 1.1, xMax: p.viewport.xMax * 1.1, yMin: p.viewport.yMin * 1.1, yMax: p.viewport.yMax * 1.1 } }), false)}><ZoomOut className="h-3.5 w-3.5" /></button>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input
          className="min-w-[280px] flex-1 rounded-lg border border-border bg-background/70 px-3 py-2 text-sm"
          value={equationDraft}
          onChange={(e) => setEquationDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyEquation();
            }
          }}
        />
        <button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground" onClick={applyEquation}>Apply</button>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <label className="text-xs font-semibold text-muted-foreground">Twist</label>
        <input
          type="range"
          min={-30}
          max={30}
          step={1}
          value={state.rotateDeg}
          onChange={(e) => updateState((p) => ({ ...p, rotateDeg: Number(e.target.value) }), false)}
          className="w-40"
        />
        <span className="text-xs font-semibold">{state.rotateDeg} deg</span>
        {parseError && <span className="text-xs text-red-500">{parseError}</span>}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none rounded-xl border border-border/70 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.2),transparent_42%),radial-gradient(circle_at_85%_85%,rgba(16,185,129,0.18),transparent_38%),linear-gradient(180deg,rgba(2,6,23,0.04),rgba(2,6,23,0.01))]"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <g pointerEvents="none">
          {[90, 170, 250].map((r, i) => (
            <motion.circle
              key={r}
              cx={W * 0.52}
              cy={H * 0.52}
              r={r}
              fill="none"
              stroke="rgba(14,165,233,0.12)"
              strokeWidth={1.25}
              strokeDasharray="7 9"
              animate={{ opacity: [0.15, 0.35, 0.15], rotate: [0, 18, 0] }}
              transition={{ duration: 7 + i * 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </g>
        <g transform={`rotate(${state.rotateDeg}, ${W / 2}, ${H / 2})`}>
          {ticks.x.map((v) => {
            if (Math.abs(v) < 1e-6) return null;
            const x = toSvgX(v, state.viewport);
            return <line key={`gx-${v}`} x1={x} x2={x} y1={PAD} y2={H - PAD} stroke="rgba(148,163,184,0.12)" strokeWidth={0.8} strokeDasharray="3 12" />;
          })}
          {ticks.y.map((v) => {
            if (Math.abs(v) < 1e-6) return null;
            const y = toSvgY(v, state.viewport);
            return <line key={`gy-${v}`} y1={y} y2={y} x1={PAD} x2={W - PAD} stroke="rgba(148,163,184,0.12)" strokeWidth={0.8} strokeDasharray="3 12" />;
          })}

          <line x1={toSvgX(0, state.viewport)} x2={toSvgX(0, state.viewport)} y1={PAD} y2={H - PAD} stroke="rgba(15,23,42,0.8)" strokeWidth={2} />
          <line x1={PAD} x2={W - PAD} y1={toSvgY(0, state.viewport)} y2={toSvgY(0, state.viewport)} stroke="rgba(15,23,42,0.8)" strokeWidth={2} />

          {curvePaths.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              fill="none"
              stroke="#0ea5e9"
              strokeWidth={3}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25 }}
            />
          ))}

          {state.overlays.map((shape, i) => {
            if (shape.type === "point") {
              return <circle key={`p-${i}`} cx={toSvgX(shape.x, state.viewport)} cy={toSvgY(shape.y, state.viewport)} r={5.5} fill="#22c55e" />;
            }
            if (shape.type === "line") {
              return (
                <line
                  key={`l-${i}`}
                  x1={toSvgX(shape.from.x, state.viewport)}
                  y1={toSvgY(shape.from.y, state.viewport)}
                  x2={toSvgX(shape.to.x, state.viewport)}
                  y2={toSvgY(shape.to.y, state.viewport)}
                  stroke="#f59e0b"
                  strokeWidth={3}
                />
              );
            }
            return (
              <path
                key={`f-${i}`}
                d={`M ${shape.points.map((pt) => `${toSvgX(pt.x, state.viewport)} ${toSvgY(pt.y, state.viewport)}`).join(" L ")}`}
                fill="none"
                stroke="#a855f7"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            );
          })}

          {freehandBuffer.length > 1 && (
            <path
              d={`M ${freehandBuffer.map((pt) => `${toSvgX(pt.x, state.viewport)} ${toSvgY(pt.y, state.viewport)}`).join(" L ")}`}
              fill="none"
              stroke="#a855f7"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          )}

          {state.points.map((pt) => (
            <g key={pt.id}>
              <circle
                cx={toSvgX(pt.x, state.viewport)}
                cy={toSvgY(pt.y, state.viewport)}
                r={8.5}
                fill="rgba(255,255,255,0.95)"
                stroke="#0284c7"
                strokeWidth={3}
                className="cursor-grab"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  setActivePointId(pt.id);
                }}
              />
              <text x={toSvgX(pt.x, state.viewport) + 10} y={toSvgY(pt.y, state.viewport) - 8} className="fill-sky-700 text-[11px] font-bold">{pt.id}</text>
            </g>
          ))}
        </g>

        {hover && (
          <g pointerEvents="none">
            <rect x={toSvgX(hover.x, state.viewport) + 10} y={toSvgY(hover.y, state.viewport) - 28} width={104} height={22} rx={6} fill="rgba(2,6,23,0.9)" />
            <text x={toSvgX(hover.x, state.viewport) + 16} y={toSvgY(hover.y, state.viewport) - 13} className="fill-white text-[11px]">
              ({formatNum(hover.x)}, {formatNum(hover.y)})
            </text>
          </g>
        )}
      </svg>

      <p className="mt-2 text-xs text-muted-foreground">
        Ctrl+Z undo, Ctrl+Y redo. Drag control points for live equation sync. Use tools to add points, lines, and freehand overlays.
      </p>
    </div>
  );
}

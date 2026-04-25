"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import type { WhiteboardStep, SelectedElement, WhiteboardCanvasProps, CoordinatePlaneAction } from "@/types/whiteboard";
import { computeLayout, computeBoardHeight, getStepLayout, getStepLayoutByIndex } from "./layout-engine";
import type { LayoutResult } from "./layout-engine";
import { WbText } from "./elements/wb-text";
import { WbMath } from "./elements/wb-math";
import { WbShape } from "./elements/wb-shape";
import { WbHighlight } from "./elements/wb-highlight";
import { WbCoordinatePlane } from "./elements/wb-coordinate-plane";
import { WbGeometry } from "./elements/wb-geometry";
import { WbNumberLine } from "./elements/wb-number-line";
import { WbTable } from "./elements/wb-table";
import { WbIllustration } from "./elements/wb-illustration";

type SVGRect = { x: number; y: number; width: number; height: number };

function rectsIntersect(a: SVGRect, b: SVGRect) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y;
}

/** Convert a viewport DOMRect to SVG user-unit coordinates. */
function clientRectToSVG(rect: { left: number; top: number; right: number; bottom: number }, svg: SVGSVGElement): SVGRect | null {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const inv = ctm.inverse();
  const pt = svg.createSVGPoint();
  pt.x = rect.left; pt.y = rect.top;
  const tl = pt.matrixTransform(inv);
  pt.x = rect.right; pt.y = rect.bottom;
  const br = pt.matrixTransform(inv);
  return { x: tl.x - 4, y: tl.y - 2, width: br.x - tl.x + 8, height: br.y - tl.y + 4 };
}

/** Walk the KaTeX DOM and return the term text + constituent elements.
 *  Splits at .mrel (=, ≤, …) and .mbin (+, −, …). */
function findMathSelection(target: HTMLElement): { text: string; els: Element[] } {
  const fallback = { text: target.closest?.(".katex-html")?.textContent?.replace(/\s+/g, "").trim() ?? "", els: [] as Element[] };

  let base: Element | null = null;
  let cur: Element | null = target;
  while (cur) {
    if (cur.classList?.contains("base")) { base = cur; break; }
    cur = cur.parentElement;
  }
  if (!base) return fallback;

  let segment: Element | null = target as Element;
  while (segment && segment.parentElement !== base) segment = segment.parentElement;
  if (!segment) return { text: base.textContent?.replace(/\s+/g, "").trim() ?? "", els: [base] };

  // Operator clicked — return just that one element
  if (segment.classList.contains("mrel") || segment.classList.contains("mbin")) {
    return { text: segment.textContent?.trim() ?? "", els: [segment] };
  }

  const siblings = Array.from(base.children);
  let start = siblings.indexOf(segment as HTMLElement);
  let end = start;
  const isSep = (el: Element) =>
    el.classList.contains("mrel") ||
    el.classList.contains("mbin") ||
    el.classList.contains("mspace");
  while (start > 0 && !isSep(siblings[start - 1])) start--;
  while (end < siblings.length - 1 && !isSep(siblings[end + 1])) end++;

  const range = siblings.slice(start, end + 1);
  const textEls = range.filter(el => !el.classList.contains("mspace") && !el.classList.contains("mbin"));
  const text = textEls.map(el => el.textContent ?? "").join("").replace(/\s+/g, "").trim()
    || (base.textContent?.replace(/\s+/g, "").trim() ?? "");

  // All elements in range (including spaces) used for bounding rect
  const visibleEls = range.filter(el => !el.classList.contains("mspace"));
  return { text, els: visibleEls.length ? visibleEls : [segment] };
}

// selection key helper
const selKey = (el: SelectedElement) => `${el.stepId}:${el.content}`;

export function WhiteboardCanvas({
  steps,
  visibleStepIds,
  currentStepIndex,
  stepProgress,
  equalScaleCoords,
  selections = [],
  onElementSelect,
  onElementToggle,
  onElementsSelect,
  onCoordinatePlaneClick,
  onComplete,
  containerRef,
}: WhiteboardCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [measuredHeights, setMeasuredHeights] = useState<Map<number, number>>(new Map());
  const [hoveredStepId, setHoveredStepId] = useState<number | null>(null);
  // Map from selKey → SVG bounding rect, computed at click time from DOM positions
  const [selectionRects, setSelectionRects] = useState<Map<string, SVGRect>>(new Map());
  const relayoutCount = useRef(0);

  // Rubber-band drag state
  const [dragRect, setDragRect] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const dragStartRef = useRef<{ svgX: number; svgY: number } | null>(null);
  const isDraggingRef = useRef(false);
  const justDraggedRef = useRef(false);

  const clientToSVG = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const inv = ctm.inverse();
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const r = pt.matrixTransform(inv);
    return { x: r.x, y: r.y };
  }, []);

  const handleSVGMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const isOnElement = !!(e.target as Element).closest?.("[data-wbstep]");
    if (isOnElement) return;
    const pos = clientToSVG(e.clientX, e.clientY);
    if (!pos) return;
    dragStartRef.current = { svgX: pos.x, svgY: pos.y };
    isDraggingRef.current = false;
  }, [clientToSVG]);

  const layout = useMemo(
    () => computeLayout(steps, visibleStepIds, measuredHeights, { equalScaleCoords }),
    [steps, visibleStepIds, measuredHeights, equalScaleCoords],
  );

  const layoutMap = useMemo(() => {
    const map = new Map<number, LayoutResult>();
    for (const r of layout) map.set(r.stepId, r);
    return map;
  }, [layout]);

  const viewBoxHeight = useMemo(() => computeBoardHeight(layout), [layout]);

  // Callback for wb-math to report measured height
  const handleMeasure = useCallback((stepId: number, height: number) => {
    // Throttle to max 2 re-layouts
    if (relayoutCount.current >= 2) return;
    setMeasuredHeights((prev) => {
      const existing = prev.get(stepId);
      if (existing && Math.abs(existing - height) <= 10) return prev;
      relayoutCount.current++;
      const next = new Map(prev);
      next.set(stepId, height);
      return next;
    });
  }, []);

  // Reset relayout counter when steps change
  useEffect(() => {
    relayoutCount.current = 0;
  }, [steps.length]);

  // Rubber-band drag: document-level move/up so drag works outside SVG bounds
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const pos = clientToSVG(e.clientX, e.clientY);
      if (!pos) return;
      const dx = pos.x - dragStartRef.current.svgX;
      const dy = pos.y - dragStartRef.current.svgY;
      if (!isDraggingRef.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        isDraggingRef.current = true;
      }
      if (isDraggingRef.current) {
        setDragRect({ x1: dragStartRef.current.svgX, y1: dragStartRef.current.svgY, x2: pos.x, y2: pos.y });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const start = dragStartRef.current;
      dragStartRef.current = null;
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      justDraggedRef.current = true;
      setTimeout(() => { justDraggedRef.current = false; }, 0);
      setDragRect(null);

      if (!onElementsSelect) return;
      const pos = clientToSVG(e.clientX, e.clientY);
      if (!pos) return;
      const selRect: SVGRect = {
        x: Math.min(start.svgX, pos.x),
        y: Math.min(start.svgY, pos.y),
        width: Math.abs(pos.x - start.svgX),
        height: Math.abs(pos.y - start.svgY),
      };
      const matched: SelectedElement[] = [];
      for (const step of steps) {
        if (!visibleStepIds.has(step.id)) continue;
        if (step.action.type !== "write_text" && step.action.type !== "write_math") continue;
        const l = layoutMap.get(step.id);
        if (!l) continue;
        if (rectsIntersect(selRect, { x: l.x - 6, y: l.y - 4, width: l.width + 12, height: l.height + 8 })) {
          const content = step.action.type === "write_math" ? step.action.latex : step.action.text;
          matched.push({ stepId: step.id, type: step.action.type, content });
        }
      }
      if (matched.length > 0) onElementsSelect(matched);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [clientToSVG, steps, visibleStepIds, layoutMap, onElementsSelect]);

  // Track whether user is "following" (near bottom) via scroll events.
  // This captures the state BEFORE new content grows the SVG, so large
  // height jumps (e.g. coordinate planes) don't break the near-bottom check.
  const isFollowing = useRef(true);
  useEffect(() => {
    const el = containerRef?.current || scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      isFollowing.current = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  // Auto-scroll so the latest element's bottom edge sits at the viewport bottom.
  const prevVisibleCount = useRef(0);
  useEffect(() => {
    const visibleCount = visibleStepIds.size;
    const el = containerRef?.current || scrollRef.current;
    if (visibleCount > prevVisibleCount.current && el && isFollowing.current) {
      requestAnimationFrame(() => {
        let maxBottom = 0;
        for (const r of layout) {
          const bottom = r.y + r.height;
          if (bottom > maxBottom) maxBottom = bottom;
        }
        maxBottom += 24;

        if (viewBoxHeight > 0) {
          const pixelBottom = (maxBottom / viewBoxHeight) * el.scrollHeight;
          const targetScroll = Math.max(0, pixelBottom - el.clientHeight);
          el.scrollTo({ top: targetScroll, behavior: "smooth" });
        }
      });
    }
  prevVisibleCount.current = visibleCount;
  }, [visibleStepIds, viewBoxHeight, layout, containerRef]);

  // Handle "Step Burst" effect when a step finishes its animation
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; trajectories: { x: number; y: number }[] }[]>([]);
  useEffect(() => {
    if (stepProgress === 1 && currentStepIndex >= 0) {
      const l = layoutMap.get(steps[currentStepIndex]?.id);
      if (l) {
        Promise.resolve().then(() => {
          const trajectories = Array.from({ length: 8 }).map(() => ({
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100
          }));
          setBursts(prev => [...prev, { id: Date.now(), x: l.x + l.width / 2, y: l.y + l.height / 2, trajectories }]);
          setTimeout(() => {
            setBursts(prev => prev.slice(1));
          }, 1000);
        });
      }
      if (stepProgress === 1 && currentStepIndex === steps.length - 1) {
        onComplete?.();
      }
    }
  }, [stepProgress, currentStepIndex, steps, layoutMap, onComplete]);

  return (
    <div
      ref={scrollRef}
      className="h-auto w-full overflow-hidden relative"
    >

      <svg
        ref={svgRef}
        viewBox={`0 0 1000 ${viewBoxHeight}`}
        className="w-full relative z-10"
        preserveAspectRatio="xMinYMin meet"
        style={{
          minHeight: viewBoxHeight > 600 ? `${(viewBoxHeight / 600) * 100}%` : "100%",
          userSelect: "none",
        }}
        onMouseDown={handleSVGMouseDown}
        onClick={() => { if (justDraggedRef.current) return; onElementSelect?.(null); }}
      >

        {/* Layer 1: Highlights */}
        {steps.map((step, idx) => {
          if (!visibleStepIds.has(step.id)) return null;
          if (step.action.type !== "highlight") return null;
          const isCurrentStep = idx === currentStepIndex;
          const progress = isCurrentStep ? stepProgress : 1;

          // New: targetStepIndex-based highlight
          if (step.action.targetStepIndex != null) {
            const targetLayout = getStepLayoutByIndex(layout, steps, step.action.targetStepIndex);
            if (!targetLayout) return null;
            return (
              <g key={`hl-${step.id}`}>
                <WbHighlight
                  x={targetLayout.x - 8}
                  y={targetLayout.y - 4}
                  width={targetLayout.width + 16}
                  height={targetLayout.height + 8}
                  color={step.action.color}
                  progress={progress}
                />
              </g>
            );
          }

          // Legacy: region-based highlight with backward compat
          if (step.action.region) {
            const region = step.action.region;
            return (
              <g key={`hl-${step.id}`}>
                <WbHighlight
                  x={(region.position.x / 100) * 1000}
                  y={(region.position.y / 100) * 600}
                  width={(region.width / 100) * 1000}
                  height={80}
                  color={step.action.color}
                  progress={progress}
                />
              </g>
            );
          }

          // Legacy: targetStepId
          if (step.action.targetStepId != null) {
            const targetLayout = getStepLayout(layout, step.action.targetStepId);
            if (!targetLayout) return null;
            return (
              <g key={`hl-${step.id}`}>
                <WbHighlight
                  x={targetLayout.x - 8}
                  y={targetLayout.y - 4}
                  width={targetLayout.width + 16}
                  height={targetLayout.height + 8}
                  color={step.action.color}
                  progress={progress}
                />
              </g>
            );
          }

          return null;
        })}

        {/* Layer 2: Shapes */}
        {steps.map((step, idx) => {
          if (!visibleStepIds.has(step.id)) return null;
          if (step.action.type !== "draw_shape") return null;
          const isCurrentStep = idx === currentStepIndex;
          const progress = isCurrentStep ? stepProgress : 1;
          const l = layoutMap.get(step.id);
          if (!l) return null;
          
          return (
            <g key={`sh-${step.id}`}>
              {/* Particle Sparkle Effect when drawing shape */}
              {isCurrentStep && stepProgress > 0 && stepProgress < 1 && (
                <motion.circle
                  cx={l.x + (l.width * stepProgress)}
                  cy={l.y + (l.height * stepProgress)}
                  r={8}
                  fill="var(--athena-amber)"
                  initial={{ opacity: 0.5, scale: 0.8 }}
                  animate={{ opacity: [0.5, 0.8, 0], scale: [0.8, 1.5, 2] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="mix-blend-screen"
                  style={{ filter: "blur(4px)" }}
                />
              )}
              <WbShape
                shape={step.action.shape}
                points={step.action.points}
                x={l.x}
                y={l.y}
                width={l.width}
                height={l.height}
                style={step.action.style}
                progress={progress}
                isAnimating={isCurrentStep && stepProgress < 1}
              />
            </g>
          );
        })}

        {/* Layer 3: Text and Math */}
        {steps.map((step, idx) => {
          if (!visibleStepIds.has(step.id)) return null;
          const { action } = step;
          if (action.type !== "write_text" && action.type !== "write_math") return null;
          const isCurrentStep = idx === currentStepIndex;
          const progress = isCurrentStep ? stepProgress : 1;
          const l = layoutMap.get(step.id);
          if (!l) return null;

          if (action.type === "write_text") {
            const isHovered = !!(onElementSelect && hoveredStepId === step.id);
            const stepSels = selections.filter(s => s.stepId === step.id);
            const isSelected = stepSels.length > 0;

            const handleTextClick = (e: React.MouseEvent<SVGGElement>) => {
              e.stopPropagation();
              if (!onElementSelect) return;
              const svg = (e.currentTarget as SVGGElement).ownerSVGElement;
              let el: SelectedElement;
              let rect: SVGRect | null = null;
              if (e.target instanceof SVGTSpanElement) {
                const word = (e.target.textContent ?? "").replace(/^\s+|\s+$/, "").trim();
                if (word && word !== action.text) {
                  el = { stepId: step.id, type: "write_text", content: word, isTerm: true };
                  if (svg) rect = clientRectToSVG(e.target.getBoundingClientRect(), svg);
                } else {
                  el = { stepId: step.id, type: "write_text", content: action.text };
                }
              } else {
                el = { stepId: step.id, type: "write_text", content: action.text };
              }
              const key = selKey(el);
              if ((e.metaKey || e.ctrlKey) && onElementToggle) {
                const alreadyIn = selections.some(s => selKey(s) === key);
                setSelectionRects(prev => {
                  const m = new Map(prev);
                  if (alreadyIn) m.delete(key); else if (rect) m.set(key, rect);
                  return m;
                });
                onElementToggle(el);
              } else {
                setSelectionRects(rect ? new Map([[key, rect]]) : new Map());
                onElementSelect(el);
              }
            };

            return (
              <g
                key={`txt-${step.id}`}
                data-wbstep={step.id}
                style={{ cursor: onElementSelect ? "pointer" : "default" }}
                onMouseEnter={() => onElementSelect && setHoveredStepId(step.id)}
                onMouseLeave={() => setHoveredStepId(null)}
                onClick={handleTextClick}
              >
                {isHovered && !isSelected && (
                  <rect x={l.x - 8} y={l.y - 6} width={l.width + 16} height={l.height + 12} rx={8}
                    className="fill-primary/5 stroke-primary/30" strokeWidth={2} strokeDasharray="6 4" />
                )}
                {stepSels.map(sel => {
                  const r = selectionRects.get(selKey(sel));
                  return (
                    <motion.rect key={selKey(sel)}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      x={r ? r.x - 2 : l.x - 10} y={r ? r.y - 2 : l.y - 8}
                      width={r ? r.width + 4 : l.width + 20} height={r ? r.height + 4 : l.height + 16}
                      rx={10} fill="none" style={{ stroke: "var(--athena-amber)" }} strokeWidth={3} 
                      className="shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
                  );
                })}
                <WbText
                  text={action.text}
                  x={l.x} y={l.y} width={l.width} height={l.height}
                  style={action.style} reveal={action.reveal}
                  progress={progress} isAnimating={isCurrentStep && stepProgress < 1}
                />
                <rect x={l.x - 6} y={l.y - 4} width={l.width + 12} height={l.height + 8}
                  fill="rgba(0,0,0,0)" pointerEvents="all" />
              </g>
            );
          }

          if (action.type === "write_math") {
            const isHovered = !!(onElementSelect && hoveredStepId === step.id);
            const stepSels = selections.filter(s => s.stepId === step.id);
            const isSelected = stepSels.length > 0;

            const handleMathClick = (e: React.MouseEvent<SVGGElement>) => {
              e.stopPropagation();
              if (!onElementSelect) return;
              const svg = (e.currentTarget as SVGGElement).ownerSVGElement;
              let el: SelectedElement;
              let rect: SVGRect | null = null;
              if (e.target instanceof HTMLElement) {
                const { text, els } = findMathSelection(e.target);
                const isTerm = text.length > 0 && text !== action.latex;
                el = { stepId: step.id, type: "write_math", content: text || action.latex, isTerm };
                if (svg && els.length > 0) {
                  const domRects = els.map(e => e.getBoundingClientRect());
                  const union = {
                    left: Math.min(...domRects.map(r => r.left)),
                    top: Math.min(...domRects.map(r => r.top)),
                    right: Math.max(...domRects.map(r => r.right)),
                    bottom: Math.max(...domRects.map(r => r.bottom)),
                  };
                  rect = clientRectToSVG(union, svg);
                }
              } else {
                el = { stepId: step.id, type: "write_math", content: action.latex };
              }
              const key = selKey(el);
              if ((e.metaKey || e.ctrlKey) && onElementToggle) {
                const alreadyIn = selections.some(s => selKey(s) === key);
                setSelectionRects(prev => {
                  const m = new Map(prev);
                  if (alreadyIn) m.delete(key); else if (rect) m.set(key, rect);
                  return m;
                });
                onElementToggle(el);
              } else {
                setSelectionRects(rect ? new Map([[key, rect]]) : new Map());
                onElementSelect(el);
              }
            };

            return (
              <g
                key={`math-${step.id}`}
                data-wbstep={step.id}
                style={{ cursor: onElementSelect ? "pointer" : "default" }}
                onMouseEnter={() => onElementSelect && setHoveredStepId(step.id)}
                onMouseLeave={() => setHoveredStepId(null)}
                onClick={handleMathClick}
              >
                {isHovered && !isSelected && (
                  <rect x={l.x - 8} y={l.y - 6} width={l.width + 16} height={l.height + 12} rx={8}
                    className="fill-primary/5 stroke-primary/30" strokeWidth={2} strokeDasharray="6 4" />
                )}
                {stepSels.map(sel => {
                  const r = selectionRects.get(selKey(sel));
                  return (
                    <motion.rect key={selKey(sel)}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      x={r ? r.x - 2 : l.x - 10} y={r ? r.y - 2 : l.y - 8}
                      width={r ? r.width + 4 : l.width + 20} height={r ? r.height + 4 : l.height + 16}
                      rx={10} fill="none" style={{ stroke: "var(--athena-amber)" }} strokeWidth={3}
                      className="shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
                  );
                })}
                {/* Hit-target BEFORE WbMath so foreignObject sits on top */}
                <rect x={l.x - 6} y={l.y - 4} width={l.width + 12} height={l.height + 8}
                  fill="rgba(0,0,0,0)" pointerEvents="all" />
                <WbMath
                  latex={action.latex}
                  x={l.x}
                  y={l.y}
                  width={l.width}
                  height={l.height}
                  style={action.style}
                  progress={progress}
                  isAnimating={isCurrentStep && stepProgress < 1}
                  onMeasure={(h) => handleMeasure(step.id, h)}
                />
              </g>
            );
          }

          return null;
        })}

        {/* Layer 4: Rich visualizations */}
        {steps.map((step, idx) => {
          if (!visibleStepIds.has(step.id)) return null;
          const { action } = step;
          const l = layoutMap.get(step.id);
          if (!l) return null;
          const isCurrentStep = idx === currentStepIndex;
          const progress = isCurrentStep ? stepProgress : 1;
          const animating = isCurrentStep && stepProgress < 1;

          switch (action.type) {
            case "coordinate_plane":
              return (
                <g 
                  key={`cp-${step.id}`}
                  style={{ cursor: onCoordinatePlaneClick ? "pointer" : "default" }}
                  onClick={(e) => {
                    if (onCoordinatePlaneClick) {
                      e.stopPropagation();
                      onCoordinatePlaneClick(action as CoordinatePlaneAction);
                    }
                  }}
                >
                  <WbCoordinatePlane
                    action={action}
                    x={l.x}
                    y={l.y}
                    width={l.width}
                    height={l.height}
                    progress={progress}
                    isAnimating={animating}
                    equalScale={equalScaleCoords}
                  />
                  {onCoordinatePlaneClick && (
                    <rect x={l.x} y={l.y} width={l.width} height={l.height} fill="transparent" pointerEvents="all" />
                  )}
                </g>
              );
            case "geometry":
              return (
                <g key={`geo-${step.id}`}>
                  <WbGeometry
                    action={action}
                    x={l.x}
                    y={l.y}
                    width={l.width}
                    height={l.height}
                    progress={progress}
                    isAnimating={animating}
                  />
                </g>
              );
            case "number_line":
              return (
                <g key={`nl-${step.id}`}>
                  <WbNumberLine
                    action={action}
                    x={l.x}
                    y={l.y}
                    width={l.width}
                    height={l.height}
                    progress={progress}
                    isAnimating={animating}
                  />
                </g>
              );
            case "table":
              return (
                <g key={`tbl-${step.id}`}>
                  <WbTable
                    action={action}
                    x={l.x}
                    y={l.y}
                    width={l.width}
                    height={l.height}
                    progress={progress}
                    isAnimating={animating}
                  />
                </g>
              );
            case "illustration":
              return (
                <g key={`ill-${step.id}`}>
                  <WbIllustration
                    type={action.illustrationType}
                    x={l.x}
                    y={l.y}
                    width={action.width ?? l.width}
                    height={action.height ?? l.height}
                    style={action.style}
                    progress={progress}
                    isAnimating={animating}
                  />
                </g>
              );
            default:
              return null;
          }
        })}
        {/* Step Completion Bursts */}
        {bursts.map(b => (
          <g key={b.id} transform={`translate(${b.x}, ${b.y})`}>
            {b.trajectories.map((t, i) => (
              <motion.circle
                key={i}
                r={3}
                fill="var(--athena-amber)"
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ 
                  x: t.x, 
                  y: t.y,
                  opacity: 0,
                  scale: 0
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            ))}
          </g>
        ))}
        {/* Rubber-band drag selection rect */}
        {dragRect && (
          <rect
            x={Math.min(dragRect.x1, dragRect.x2)}
            y={Math.min(dragRect.y1, dragRect.y2)}
            width={Math.abs(dragRect.x2 - dragRect.x1)}
            height={Math.abs(dragRect.y2 - dragRect.y1)}
            style={{ fill: "var(--wb-hover-fill)", stroke: "var(--athena-amber)" }}
            fillOpacity={0.4}
            strokeWidth={1.5}
            strokeDasharray="5 3"
            pointerEvents="none"
          />
        )}
        {/* Layer 5: Drawing Indicator (Magic Pen) */}
        {steps[currentStepIndex] && stepProgress > 0 && stepProgress < 1 && (
          <g>
            {(() => {
              const l = layoutMap.get(steps[currentStepIndex].id);
              if (!l) return null;
              // Approximate current tip position based on layout and progress
              const tx = l.x + l.width * stepProgress;
              const ty = l.y + l.height / 2; // Center Y for simplicity in text/math
              return (
                <motion.g
                  key="magic-pen"
                  style={{ x: tx, y: ty }}
                >
                  <circle r={6} fill="var(--athena-amber)" style={{ filter: "blur(4px)" }} />
                  <circle r={3} fill="white" />
                  <motion.circle
                    r={12}
                    fill="none"
                    stroke="var(--athena-amber)"
                    strokeWidth={2}
                    animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0.1, 0.6] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                </motion.g>
              );
            })()}
          </g>
        )}
      </svg>
    </div>
  );
}

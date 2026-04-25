"use client";

import { motion } from "framer-motion";
import type { CoordinatePlaneAction } from "@/types/whiteboard";
import { adaptWbColor, useIsDarkMode } from "../wb-color";

type WbCoordinatePlaneProps = {
  action: CoordinatePlaneAction;
  x: number;
  y: number;
  width: number;
  height: number;
  progress: number;
  isAnimating: boolean;
  equalScale?: boolean;
};

const PADDING = 40;

/** Map data coordinates to SVG coordinates within the bounding box. */
function dataToSvg(
  dataX: number,
  dataY: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): [number, number] {
  const sx = bx + PADDING + ((dataX - xMin) / (xMax - xMin)) * (bw - 2 * PADDING);
  const sy = by + PADDING + ((yMax - dataY) / (yMax - yMin)) * (bh - 2 * PADDING);
  return [sx, sy];
}

/** Catmull-Rom to cubic Bezier control points. */
function catmullRomToBezier(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
): { cp1: [number, number]; cp2: [number, number] } {
  return {
    cp1: [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
    cp2: [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
  };
}

/** Build a smooth SVG path string from data points via Catmull-Rom interpolation. */
function buildSmoothPath(
  dataPoints: [number, number][],
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): string {
  if (dataPoints.length < 2) return "";

  const pts = dataPoints.map(([dx, dy]) => dataToSvg(dx, dy, xMin, xMax, yMin, yMax, bx, by, bw, bh));

  if (pts.length === 2) {
    return `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]}`;
  }

  let d = `M${pts[0][0]},${pts[0][1]}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const { cp1, cp2 } = catmullRomToBezier(p0, p1, p2, p3);
    d += ` C${cp1[0]},${cp1[1]} ${cp2[0]},${cp2[1]} ${p2[0]},${p2[1]}`;
  }

  return d;
}

export function WbCoordinatePlane({
  action,
  x,
  y,
  width,
  height,
  progress,
  isAnimating,
  equalScale,
}: WbCoordinatePlaneProps) {
  const isDark = useIsDarkMode();
  const [xMin, xMax] = action.xRange;
  const [yMin, yMax] = action.yRange;
  const showGrid = action.showGrid !== false;

  // When equalScale is enabled, enforce equal px-per-unit on both axes
  // Otherwise use the raw bounding box (original behavior)
  let bx = x, by = y, bw = width, bh = height;
  if (equalScale) {
    const xSpan = (xMax - xMin) || 1;
    const ySpan = (yMax - yMin) || 1;
    const pw = width - 2 * PADDING;
    const ph = height - 2 * PADDING;
    const s = Math.min(pw / xSpan, ph / ySpan);
    const ew = xSpan * s;
    const eh = ySpan * s;
    bx = x + (pw - ew) / 2;
    by = y + (ph - eh) / 2;
    bw = ew + 2 * PADDING;
    bh = eh + 2 * PADDING;
  }

  // Compute tick values with smart intervals
  function niceTickInterval(rangeMin: number, rangeMax: number): number {
    const span = rangeMax - rangeMin;
    if (span <= 0) return 1;
    // Target roughly 8-12 ticks
    const rough = span / 10;
    // Round to a "nice" number: 1, 2, 5, 10, 20, 25, 50, ...
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const residual = rough / mag;
    let nice: number;
    if (residual <= 1.5) nice = 1;
    else if (residual <= 3.5) nice = 2;
    else if (residual <= 7.5) nice = 5;
    else nice = 10;
    return Math.max(nice * mag, 1);
  }

  const xInterval = niceTickInterval(xMin, xMax);
  const yInterval = niceTickInterval(yMin, yMax);

  const xTicks: number[] = [];
  const yTicks: number[] = [];
  for (let v = Math.ceil(xMin / xInterval) * xInterval; v <= Math.floor(xMax); v += xInterval) xTicks.push(v);
  for (let v = Math.ceil(yMin / yInterval) * yInterval; v <= Math.floor(yMax); v += yInterval) yTicks.push(v);

  // Origin in SVG coords
  const [originX, originY] = dataToSvg(0, 0, xMin, xMax, yMin, yMax, bx, by, bw, bh);

  // Axis endpoints
  const [axisLeft] = dataToSvg(xMin, 0, xMin, xMax, yMin, yMax, bx, by, bw, bh);
  const [axisRight] = dataToSvg(xMax, 0, xMin, xMax, yMin, yMax, bx, by, bw, bh);
  const [, axisTop] = dataToSvg(0, yMax, xMin, xMax, yMin, yMax, bx, by, bw, bh);
  const [, axisBottom] = dataToSvg(0, yMin, xMin, xMax, yMin, yMax, bx, by, bw, bh);

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Glow Definition */}
      <defs>
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <pattern id="scanlines" width="100%" height="4" patternUnits="userSpaceOnUse">
          <path d="M 0 0 L 1000 0" stroke="rgba(251,191,36,0.03)" strokeWidth="1" fill="none" />
        </pattern>
      </defs>

      {/* Grid Scanlines for techy look */}
      <rect x={bx + PADDING} y={by + PADDING} width={bw - 2 * PADDING} height={bh - 2 * PADDING} fill="url(#scanlines)" pointerEvents="none" />

      {/* Soft guide dots (student-friendly, less visual noise than full grid lines) */}
      {showGrid && (
        <g opacity={0.45}>
          {xTicks.map((v) => {
            const [sx] = dataToSvg(v, 0, xMin, xMax, yMin, yMax, bx, by, bw, bh);
            return yTicks.map((yv) => {
              const [, sy] = dataToSvg(0, yv, xMin, xMax, yMin, yMax, bx, by, bw, bh);
              return (
                <motion.circle
                  key={`gd-${v}-${yv}`}
                  cx={sx}
                  cy={sy}
                  r="2.5"
                  fill="var(--athena-amber)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.1, 0.4, 0.1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: (v + yv) * 0.1 }}
                  style={{ cursor: "crosshair" }}
                  whileHover={{ scale: 2, opacity: 1, fill: "#fff" }}
                >
                  <title>{`(${v}, ${yv})`}</title>
                </motion.circle>
              );
            });
          })}
        </g>
      )}

      {/* Axes background bounding box (glass panel look) */}
      <rect
        x={bx + PADDING}
        y={by + PADDING}
        width={bw - 2 * PADDING}
        height={bh - 2 * PADDING}
        fill="url(#plane-soft-fill)"
        rx="8"
        stroke="var(--athena-amber)"
        strokeOpacity="0.15"
        strokeWidth="1"
      />

      <defs>
        <linearGradient id="plane-soft-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--background)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--athena-amber)" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* X axis */}
      <line
        x1={axisLeft}
        y1={originY}
        x2={axisRight}
        y2={originY}
        style={{ stroke: "var(--athena-amber)" }}
        strokeWidth="2.5"
        filter="url(#neon-glow) url(#sketchy)"
      />
      {/* X axis arrow */}
      <polygon
        points={`${axisRight},${originY} ${axisRight - 8},${originY - 4} ${axisRight - 8},${originY + 4}`}
        style={{ fill: "var(--athena-amber)" }}
        filter="url(#neon-glow)"
      />

      {/* Y axis */}
      <line
        x1={originX}
        y1={axisBottom}
        x2={originX}
        y2={axisTop}
        style={{ stroke: "var(--athena-amber)" }}
        strokeWidth="2.5"
        filter="url(#neon-glow) url(#sketchy)"
      />
      {/* Y axis arrow */}
      <polygon
        points={`${originX},${axisTop} ${originX - 4},${axisTop + 8} ${originX + 4},${axisTop + 8}`}
        style={{ fill: "var(--athena-amber)" }}
        filter="url(#neon-glow)"
      />

      {/* X tick marks + labels */}
      {xTicks.map((v) => {
        if (v === 0) return null;
        const [sx] = dataToSvg(v, 0, xMin, xMax, yMin, yMax, bx, by, bw, bh);
        return (
          <g key={`xt-${v}`}>
            <line x1={sx} y1={originY - 6} x2={sx} y2={originY + 6} style={{ stroke: "var(--foreground)" }} strokeWidth="1.5" />
            <text
              x={sx}
              y={originY + 20}
              textAnchor="middle"
              fontSize="12"
              style={{ fill: "var(--foreground)", fontWeight: 500 }}
              fontFamily="system-ui, sans-serif"
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* Y tick marks + labels */}
      {yTicks.map((v) => {
        if (v === 0) return null;
        const [, sy] = dataToSvg(0, v, xMin, xMax, yMin, yMax, bx, by, bw, bh);
        return (
          <g key={`yt-${v}`}>
            <line x1={originX - 6} y1={sy} x2={originX + 6} y2={sy} style={{ stroke: "var(--foreground)" }} strokeWidth="1.5" />
            <text
              x={originX - 12}
              y={sy + 4}
              textAnchor="end"
              fontSize="12"
              style={{ fill: "var(--foreground)", fontWeight: 500 }}
              fontFamily="system-ui, sans-serif"
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* Axis labels */}
      {action.axisLabels?.x && (
        <text
          x={axisRight + 16}
          y={originY + 4}
          fontSize="14"
          fontWeight="bold"
          style={{ fill: "var(--primary)" }}
          fontFamily="system-ui, sans-serif"
        >
          {action.axisLabels.x}
        </text>
      )}
      {action.axisLabels?.y && (
        <text
          x={originX + 8}
          y={axisTop - 12}
          fontSize="14"
          fontWeight="bold"
          style={{ fill: "var(--primary)" }}
          fontFamily="system-ui, sans-serif"
        >
          {action.axisLabels.y}
        </text>
      )}

      {/* Elements */}
      {action.elements.map((elem, i) => {
        switch (elem.type) {
          case "function": {
            const pathD = buildSmoothPath(
              elem.points,
              xMin,
              xMax,
              yMin,
              yMax,
              bx,
              by,
              bw,
              bh,
            );
            const pathRef = `coord-fn-${i}`;
            const functionColor = adaptWbColor(elem.style?.strokeColor ?? "var(--primary)", isDark);
            return (
              <g key={`fn-${i}`}>
                {/* Glowing function line */}
                <motion.path
                  d={pathD}
                  fill="none"
                  stroke={functionColor}
                  strokeWidth={(elem.style?.strokeWidth ?? 2) * 1.5}
                  strokeDasharray={elem.style?.dashed ? "6 4" : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#neon-glow)"
                  initial={isAnimating ? { pathLength: 0 } : undefined}
                  animate={{ pathLength: progress }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                {elem.label && (
                  <text
                    x={dataToSvg(elem.points[elem.points.length - 1][0], elem.points[elem.points.length - 1][1], xMin, xMax, yMin, yMax, bx, by, bw, bh)[0] + 8}
                    y={dataToSvg(elem.points[elem.points.length - 1][0], elem.points[elem.points.length - 1][1], xMin, xMax, yMin, yMax, bx, by, bw, bh)[1] - 8}
                    fontSize="14"
                    fontWeight="bold"
                    fill={functionColor}
                    fontFamily="system-ui, sans-serif"
                  >
                    {elem.label}
                  </text>
                )}
              </g>
            );
          }

          case "point": {
            const [px, py] = dataToSvg(elem.at[0], elem.at[1], xMin, xMax, yMin, yMax, bx, by, bw, bh);
            const filled = elem.style?.filled !== false;
            const r = elem.style?.radius ?? 6;
            const ptColor = adaptWbColor(elem.style?.color ?? "var(--primary)", isDark);
            return (
              <g key={`pt-${i}`}>
                {/* Glowing point */}
                <motion.circle
                  cx={px}
                  cy={py}
                  r={r}
                  fill={filled ? ptColor : "var(--wb-canvas)"}
                  stroke={ptColor}
                  strokeWidth="3"
                  filter="url(#neon-glow)"
                  initial={{ scale: 0 }}
                  animate={{ scale: progress > 0 ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                />
                {elem.label && (
                  <text
                    x={px + r + 6}
                    y={py - r - 4}
                    fontSize="12"
                    fontWeight="bold"
                    style={{ fill: ptColor }}
                    fontFamily="system-ui, sans-serif"
                  >
                    {elem.label}
                  </text>
                )}
              </g>
            );
          }

          case "line": {
            const [x1, y1] = dataToSvg(elem.from[0], elem.from[1], xMin, xMax, yMin, yMax, bx, by, bw, bh);
            const [x2, y2] = dataToSvg(elem.to[0], elem.to[1], xMin, xMax, yMin, yMax, bx, by, bw, bh);
            const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const lnColor = elem.style?.strokeColor ?? "var(--primary)";
            return (
              <g key={`ln-${i}`}>
                <motion.line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  style={{ stroke: lnColor }}
                  strokeWidth={(elem.style?.strokeWidth ?? 1.5) * 1.5}
                  strokeDasharray={elem.style?.dashed ? "6 4" : (isAnimating ? len : undefined)}
                  strokeDashoffset={isAnimating ? len * (1 - progress) : 0}
                  filter="url(#neon-glow)"
                />
                {elem.label && (
                  <text
                    x={(x1 + x2) / 2 + 8}
                    y={(y1 + y2) / 2 - 8}
                    fontSize="12"
                    fontWeight="bold"
                    style={{ fill: lnColor }}
                    fontFamily="system-ui, sans-serif"
                  >
                    {elem.label}
                  </text>
                )}
              </g>
            );
          }

          case "vertical_line": {
            const [vx, vTop] = dataToSvg(elem.x, yMax, xMin, xMax, yMin, yMax, bx, by, bw, bh);
            const [, vBottom] = dataToSvg(elem.x, yMin, xMin, xMax, yMin, yMax, bx, by, bw, bh);
            const vlColor = elem.style?.strokeColor ?? "var(--athena-amber)";
            return (
              <g key={`vl-${i}`}>
                <line
                  x1={vx}
                  y1={vTop}
                  x2={vx}
                  y2={vBottom}
                  style={{ stroke: vlColor }}
                  strokeWidth={(elem.style?.strokeWidth ?? 1) * 1.5}
                  strokeDasharray={elem.style?.dashed ? "6 4" : "4 2"}
                  filter="url(#neon-glow)"
                />
                {elem.label && (
                  <text
                    x={vx + 6}
                    y={vTop + 14}
                    fontSize="12"
                    fontWeight="bold"
                    style={{ fill: vlColor }}
                    fontFamily="system-ui, sans-serif"
                  >
                    {elem.label}
                  </text>
                )}
              </g>
            );
          }

          case "horizontal_line": {
            const [hLeft, hy] = dataToSvg(xMin, elem.y, xMin, xMax, yMin, yMax, bx, by, bw, bh);
            const [hRight] = dataToSvg(xMax, elem.y, xMin, xMax, yMin, yMax, bx, by, bw, bh);
            const hlColor = elem.style?.strokeColor ?? "var(--athena-amber)";
            return (
              <g key={`hl-${i}`}>
                <line
                  x1={hLeft}
                  y1={hy}
                  x2={hRight}
                  y2={hy}
                  style={{ stroke: hlColor }}
                  strokeWidth={(elem.style?.strokeWidth ?? 1) * 1.5}
                  strokeDasharray={elem.style?.dashed ? "6 4" : "4 2"}
                  filter="url(#neon-glow)"
                />
                {elem.label && (
                  <text
                    x={hRight - 6}
                    y={hy - 6}
                    textAnchor="end"
                    fontSize="12"
                    fontWeight="bold"
                    style={{ fill: hlColor }}
                    fontFamily="system-ui, sans-serif"
                  >
                    {elem.label}
                  </text>
                )}
              </g>
            );
          }

          default:
            return null;
        }
      })}
    </motion.g>
  );
}

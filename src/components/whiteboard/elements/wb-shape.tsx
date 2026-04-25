"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";
import type { ShapeStyle } from "@/types/whiteboard";

type WbShapeProps = {
  shape: "line" | "arrow" | "circle" | "rect" | "thematic_icon";
  /** Points in LocalPoint (0-100) space, mapped within the bounding box */
  points: { x: number; y: number }[];
  x: number;
  y: number;
  width: number;
  height: number;
  style?: ShapeStyle;
  progress: number;
  isAnimating: boolean;
};

/** Map a LocalPoint (0-100) into SVG coords within the bounding box. */
function toSvg(p: { x: number; y: number }, bx: number, by: number, bw: number, bh: number) {
  return { x: bx + (p.x / 100) * bw, y: by + (p.y / 100) * bh };
}

// Predefined thematic icons (SVG path d strings) mapped to a 24x24 viewBox
const THEME_ICONS: Record<string, string> = {
  basketball: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-14v4c-1.84.42-3.41 1.58-4.45 3.09C7.8 11.23 8.92 10.15 11 10zM12 20c-1.57 0-3.04-.45-4.28-1.21.93-1.66 2.37-3.05 4.14-3.92V20zm2-4.8c1.87.94 3.39 2.45 4.34 4.22-1.28.79-2.79 1.25-4.41 1.25v-5.47z",
  flower: "M12 2c-.67 0-1.28.24-1.76.65C9.47 1.27 8 1.48 7.07 2.38 6.13 3.3 5.86 4.7 6.47 5.75c-.38.45-.62 1.03-.62 1.66 0 .52.16 1.01.44 1.43C5.16 9.49 4.3 10.66 4.3 12c0 2.21 1.79 4 4 4h.34c.79 1.72 2.5 2.91 4.47 3 1.97-.09 3.68-1.28 4.47-3h.34c2.21 0 4-1.79 4-4 0-1.34-.86-2.51-1.99-3.16.28-.42.44-.91.44-1.43 0-.63-.24-1.21-.62-1.66.61-1.05.34-2.45-.6-3.37C14 1.48 12.53 1.27 11.76 2.65 11.28 2.24 10.67 2 10 2m2 14v4h-2v-4H8l4-4 4 4h-2z",
  space: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4.32-6.68c-.68 0-1.23-.55-1.23-1.23s.55-1.23 1.23-1.23 1.23.55 1.23 1.23-.55 1.23-1.23 1.23zm3.2 2.76c-.68 0-1.23-.55-1.23-1.23s.55-1.23 1.23-1.23 1.23.55 1.23 1.23-.55 1.23-1.23 1.23zm3.12-4.16c-.68 0-1.23-.55-1.23-1.23s.55-1.23 1.23-1.23 1.23.55 1.23 1.23-.55 1.23-1.23 1.23z",
  sword: "M19.7 4.3c-1.8-1.8-4.7-1.8-6.5 0L6 11.5l-1.3-1.3-1.4 1.4L4.7 13l-2 2 1.4 1.4 2-2 1.4 1.4 1.4-1.4-1.3-1.3 7.2-7.2c1.8-1.8 1.8-4.7 0-6.5zm-5.1 5.1L8.8 15.2l-1.4-1.4 5.8-5.8 1.4 1.4z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
};

export function WbShape({ shape, points, x, y, width, height, style, progress, isAnimating }: WbShapeProps) {
  const [isHot, setIsHot] = useState(false);
  const glowId = useId().replace(/:/g, "");
  const strokeColor = style?.strokeColor ?? "var(--secondary-foreground)";
  const strokeWidth = (style?.strokeWidth ?? 2) + (isHot ? 0.6 : 0);
  const fillColor = style?.fillColor ?? "none";
  const dashed = style?.dashed ? "6 4" : undefined;

  if (shape === "thematic_icon" && points.length >= 1) {
    const center = toSvg(points[0], x, y, width, height);
    // Use second point for size/radius, or default to 24px
    const radius = points.length >= 2 
      ? Math.abs(toSvg(points[1], x, y, width, height).x - center.x) 
      : 24;
    
    const theme = style?.themeIcon || "star";
    const pathD = THEME_ICONS[theme] || THEME_ICONS.star;

    // We scale the 24x24 viewBox to the target radius
    const scale = (radius * 2) / 24;
    const transform = `translate(${center.x - radius}, ${center.y - radius}) scale(${scale})`;

    return (
      <g transform={transform} onMouseEnter={() => setIsHot(true)} onMouseLeave={() => setIsHot(false)}>
        <defs>
          <filter id={`shape-glow-${glowId}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={isHot ? "2.6" : "1.8"} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.path
          d={pathD}
          style={{ stroke: strokeColor, fill: fillColor === "none" ? "var(--background)" : fillColor }}
          strokeWidth={strokeWidth / scale}
          strokeDasharray={isAnimating ? 100 : undefined}
          strokeDashoffset={isAnimating ? 100 * (1 - progress) : 0}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: isHot ? 1.03 : 1 }}
          transition={{ duration: 0.4, type: "spring" }}
          filter={`url(#shape-glow-${glowId})`}
        />
      </g>
    );
  }

  if (shape === "circle" && points.length >= 2) {
    const c = toSvg(points[0], x, y, width, height);
    const e = toSvg(points[1], x, y, width, height);
    const rx = Math.abs(e.x - c.x);
    const ry = Math.abs(e.y - c.y);
    const circumference = 2 * Math.PI * Math.max(rx, ry);

    return (
      <g onMouseEnter={() => setIsHot(true)} onMouseLeave={() => setIsHot(false)}>
        <defs>
          <filter id={`shape-glow-${glowId}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={isHot ? "2.4" : "1.6"} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.ellipse
          cx={c.x}
          cy={c.y}
          rx={rx}
          ry={ry}
          style={{ stroke: strokeColor, transformBox: "fill-box", transformOrigin: "center" }}
          strokeWidth={strokeWidth}
          fill={fillColor}
          strokeDasharray={isAnimating ? circumference : undefined}
          strokeDashoffset={isAnimating ? circumference * (1 - progress) : 0}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: isHot ? 1.01 : 1 }}
          transition={{ duration: 0.2 }}
          filter={`url(#shape-glow-${glowId})`}
        />
      </g>
    );
  }

  if (shape === "rect" && points.length >= 2) {
    const p1 = toSvg(points[0], x, y, width, height);
    const p2 = toSvg(points[1], x, y, width, height);
    const rx = Math.min(p1.x, p2.x);
    const ry2 = Math.min(p1.y, p2.y);
    const w = Math.abs(p2.x - p1.x);
    const h = Math.abs(p2.y - p1.y);
    const perimeter = 2 * (w + h);

    return (
      <g onMouseEnter={() => setIsHot(true)} onMouseLeave={() => setIsHot(false)}>
        <defs>
          <linearGradient id={`shape-fill-${glowId}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(56,189,248,0.16)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0.12)" />
          </linearGradient>
          <filter id={`shape-glow-${glowId}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={isHot ? "2.8" : "1.9"} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.rect
          x={rx}
          y={ry2}
          width={w}
          height={h}
          style={{ stroke: strokeColor, transformBox: "fill-box", transformOrigin: "center" }}
          strokeWidth={strokeWidth}
          fill={fillColor === "none" ? `url(#shape-fill-${glowId})` : fillColor}
          strokeDasharray={isAnimating ? perimeter : dashed}
          strokeDashoffset={isAnimating ? perimeter * (1 - progress) : 0}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: isHot ? 1.01 : 1 }}
          transition={{ duration: 0.2 }}
          filter={`url(#shape-glow-${glowId})`}
        />
      </g>
    );
  }

  // line or arrow
  if (points.length >= 2) {
    const p1 = toSvg(points[0], x, y, width, height);
    const p2 = toSvg(points[1], x, y, width, height);
    const length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    const markerId = shape === "arrow" ? `arrow-${p1.x}-${p1.y}-${p2.x}-${p2.y}` : undefined;

    return (
      <g onMouseEnter={() => setIsHot(true)} onMouseLeave={() => setIsHot(false)}>
        <defs>
          <filter id={`shape-glow-${glowId}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={isHot ? "2.8" : "1.8"} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {shape === "arrow" && (
          <defs>
            <marker
              id={markerId}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" style={{ fill: strokeColor }} />
            </marker>
          </defs>
        )}
        <motion.line
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          style={{ stroke: strokeColor, transformBox: "fill-box", transformOrigin: "center" }}
          strokeWidth={strokeWidth}
          strokeDasharray={isAnimating ? length : dashed}
          strokeDashoffset={isAnimating ? length * (1 - progress) : 0}
          strokeLinecap="round"
          markerEnd={markerId ? `url(#${markerId})` : undefined}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: isHot ? 1.005 : 1 }}
          transition={{ duration: 0.2 }}
          filter={`url(#shape-glow-${glowId})`}
        />
      </g>
    );
  }

  return null;
}

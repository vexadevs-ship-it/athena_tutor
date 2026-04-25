"use client";

import { useId, useState, useMemo } from "react";
import { motion } from "framer-motion";
import type { ShapeStyle } from "@/types/whiteboard";

type IllustrationType = "basketball" | "flower" | "rocket" | "trophy" | "brain" | "zap";

type WbIllustrationProps = {
  type: IllustrationType;
  x: number;
  y: number;
  width: number;
  height: number;
  style?: ShapeStyle;
  progress: number;
  isAnimating: boolean;
};

const ILLUSTRATIONS: Record<IllustrationType, { path: string; viewBox: string }> = {
  basketball: {
    path: "M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20ZM12,4V20M4,12H20M5.45,5.45c3.62,3.62,9.48,3.62,13.1,0M5.45,18.55c3.62-3.62,9.48-3.62,13.1,0",
    viewBox: "0 0 24 24"
  },
  flower: {
    path: "M12,11.5a2.5,2.5,0,1,0,2.5,2.5A2.5,2.5,0,0,0,12,11.5Zm0-1.5a5,5,0,0,0-5-5,5,5,0,0,0-5,5,5,5,0,0,0,5,5,5,5,0,0,0,5-5Zm0,0a5,5,0,0,0,5-5,5,5,0,0,0,5,5,5,5,0,0,0-5,5,5,5,0,0,0-5-5Zm0,0a5,5,0,0,1,5,5,5,5,0,0,1-5,5,5,5,0,0,1-5-5,5,5,0,0,1,5-5Z",
    viewBox: "0 0 24 24"
  },
  rocket: {
    path: "M12,2L14.5,7H9.5L12,2ZM12,22L9.5,17H14.5L12,22ZM7,10V14H5L3,12L5,10H7ZM17,10V14H19L21,12L19,10H17ZM12,7A5,5,0,0,1,17,12A5,5,0,0,1,12,17A5,5,0,0,1,7,12A5,5,0,0,1,12,7Z",
    viewBox: "0 0 24 24"
  },
  trophy: {
    path: "M18,2H6V4H2V9A5,5,0,0,0,7,14h.16A5,5,0,0,0,12,18v2H8v2h8V20H12V18a5,5,0,0,0,4.84-4H17a5,5,0,0,0,5-5V4H18ZM4,6H6V12A3,3,0,0,1,4,9ZM20,9a3,3,0,0,1-2,3V6h2Z",
    viewBox: "0 0 24 24"
  },
  brain: {
    path: "M12,3A7,7,0,0,0,5,10a7,7,0,0,0,1,3.5A7,7,0,0,0,12,21a7,7,0,0,0,6-3.5A7,7,0,0,0,19,10a7,7,0,0,0-7-7Zm0,16a5,5,0,0,1-4.29-2.5A5,5,0,0,1,12,5a5,5,0,0,1,4.29,2.5A5,5,0,0,1,12,19Z",
    viewBox: "0 0 24 24"
  },
  zap: {
    path: "M13,2L3,14H11V22L21,10H13V2Z",
    viewBox: "0 0 24 24"
  }
};

export function WbIllustration({ type, x, y, width, height, style, progress, isAnimating }: WbIllustrationProps) {
  const [isHovered, setIsHovered] = useState(false);
  const glowId = useId().replace(/:/g, "");
  const strokeColor = style?.strokeColor ?? "var(--athena-amber)";
  const strokeWidth = style?.strokeWidth ?? 1.5;
  const fillColor = style?.fillColor ?? "none";

  const illustration = ILLUSTRATIONS[type] || ILLUSTRATIONS.zap;
  const { path, viewBox } = illustration;

  const [particles] = useState(() => 
    Array.from({ length: 4 }).map(() => ({
      xOffset: (Math.random() - 0.5) * 40,
      yOffset: (Math.random() - 0.5) * 40,
      duration: 1 + Math.random()
    }))
  );

  return (
    <g 
      transform={`translate(${x}, ${y})`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <defs>
        <filter id={`ill-glow-${glowId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={isHovered ? "4" : "2"} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      <motion.path
        d={path}
        viewBox={viewBox}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#ill-glow-${glowId})`}
        initial={{ pathLength: 0, opacity: 0, scale: 0.8 }}
        animate={{ 
          pathLength: progress, 
          opacity: 1, 
          scale: isHovered ? 1.05 : 1,
          rotate: isHovered ? [0, -2, 2, 0] : 0
        }}
        transition={{ 
          duration: 0.5, 
          type: "spring",
          rotate: { repeat: isHovered ? Infinity : 0, duration: 2 }
        }}
        style={{
          transformBox: "fill-box",
          transformOrigin: "center"
        }}
      />

      {/* Floating particles if hovered */}
      {isHovered && particles.map((p, i) => (
        <motion.circle
          key={i}
          r={2}
          fill={strokeColor}
          initial={{ x: 12, y: 12, opacity: 0 }}
          animate={{ 
            x: 12 + p.xOffset, 
            y: 12 + p.yOffset,
            opacity: [0, 0.8, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{ 
            duration: p.duration, 
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </g>
  );
}

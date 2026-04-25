"use client";

import { useEffect, useRef } from "react";

export function CursorGlow() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let raf = 0;

    const update = () => {
      x += (targetX - x) * 0.14;
      y += (targetY - y) * 0.14;
      if (ref.current) {
        const glowSize = 40;
        const half = glowSize / 2;
        const clampedX = Math.min(window.innerWidth - half, Math.max(half, x));
        const clampedY = Math.min(window.innerHeight - half, Math.max(half, y));
        ref.current.style.transform = `translate3d(${clampedX - half}px, ${clampedY - half}px, 0)`;
      }
      raf = window.requestAnimationFrame(update);
    };

    const onPointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    raf = window.requestAnimationFrame(update);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-0 top-0 z-40 hidden h-10 w-10 rounded-full bg-sky-400/20 blur-xl md:block"
      aria-hidden="true"
    />
  );
}

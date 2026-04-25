"use client";

import { motion } from "framer-motion";
import { AnimatedSprite } from "@/components/pixel-art/animated-sprite";

export function WelcomeHeader({
  displayName,
}: {
  displayName: string | null;
  avatarUrl: string | null;
}) {
  const name = displayName?.split(" ")[0] || "Warrior";

  return (
    <div className="flex items-center gap-6 p-6 pb-8 relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-athena-amber/20 via-transparent to-transparent blur-2xl pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-athena-amber/30 to-amber-600/10 p-1 shadow-[0_0_30px_rgba(251,191,36,0.3)] backdrop-blur-sm border border-athena-amber/40"
      >
        <div className="overflow-hidden rounded-xl bg-background/80 p-2 backdrop-blur-md">
          <AnimatedSprite
            src="/images/pixel-art/profile-avatar.png"
            alt="Avatar"
            width={64}
            height={64}
            className="drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]"
          />
        </div>
      </motion.div>
      <div className="relative z-10">
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-xs font-bold uppercase tracking-[0.3em] text-athena-amber drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]"
        >
          Welcome back, hero
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="text-4xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-foreground via-foreground to-foreground/60 drop-shadow-sm mt-1"
        >
          {name}
        </motion.h1>
      </div>
    </div>
  );
}

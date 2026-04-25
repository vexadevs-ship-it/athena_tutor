"use client";

import Link from "next/link";
import { Heart, MessageCircle, Sparkles, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedSprite } from "@/components/pixel-art/animated-sprite";

export function CompanionCard() {
  return (
    <Link href="/mentor">
      <motion.div 
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-pink-500/20 bg-card/40 p-5 backdrop-blur-xl transition-all duration-300 hover:border-pink-500/40 hover:shadow-[0_0_25px_rgba(236,72,153,0.12)]"
      >
        {/* Ambient background glow */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-pink-500/10 blur-3xl transition-all duration-500 group-hover:bg-pink-500/20 pointer-events-none" />
        <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          {/* Avatar / Icon Container */}
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-pink-500/30 bg-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.15)] group-hover:shadow-[0_0_20px_rgba(236,72,153,0.25)] transition-all">
             <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent" />
             <div className="relative z-10">
               {/* Using the heart icon as a placeholder, but in a premium way */}
               <Heart className="h-7 w-7 text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)] animate-pulse" />
             </div>
             <div className="absolute -right-1.5 -bottom-1.5">
                <Sparkles className="h-4 w-4 text-pink-400 animate-bounce" />
             </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-black uppercase tracking-widest text-foreground">Athena Mentor</p>
              <Wand2 className="h-3 w-3 text-pink-400/60" />
            </div>
            <p className="text-xs font-bold text-pink-500/80 mt-0.5 line-clamp-1">
              Your AI companion is ready to chat
            </p>
            <p className="text-[10px] text-muted-foreground font-medium mt-1">
              Get personalized guidance & motivation
            </p>
          </div>

          <motion.div
             whileHover={{ rotate: 12, scale: 1.1 }}
             className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background/50 border border-border/60 shadow-sm group-hover:border-pink-500/30 transition-colors"
          >
            <MessageCircle className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-pink-500" />
          </motion.div>
        </div>

        {/* Bottom interactive hint */}
        <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 group-hover:text-pink-500/60 transition-colors">
           <span>Status: Online</span>
           <span className="flex items-center gap-1">Tap to Summon <ArrowRight className="h-2.5 w-2.5" /></span>
        </div>
      </motion.div>
    </Link>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

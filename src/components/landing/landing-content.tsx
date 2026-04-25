"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles, ArrowRight, Brain, Zap, Target, Trophy, ShieldCheck } from "lucide-react";

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const floating: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export function LandingContent() {
  return (
    <div className="relative min-h-screen flex flex-col selection:bg-primary/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-athena-amber/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Nav */}
      <header className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-foreground uppercase">
            Athena
          </span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <ThemeToggle />
          <Link href="/sign-in" className="hidden sm:block">
            <Button variant="ghost" className="font-bold hover:bg-white/10">
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="rounded-xl px-6 font-black uppercase tracking-wider shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
              Get Started
            </Button>
          </Link>
        </motion.div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-12 pb-24 text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="max-w-4xl space-y-10"
        >
          {/* Badge */}
          <motion.div variants={fadeInUp} className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-primary backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              The AI-Powered Learning RPG
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div variants={fadeInUp} className="space-y-4">
            <h1 className="text-5xl font-black tracking-tight sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9]">
              Consistency <br className="hidden sm:block" /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-athena-amber">
                beats intensity.
              </span>
            </h1>
            <motion.p 
              variants={fadeInUp}
              className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground/80 leading-relaxed font-medium"
            >
              Athena combines high-fidelity AI tutoring with gamified habit building
              to forge the study discipline that actually raises your SAT score.
            </motion.p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-lg rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-[1.02]">
                Start Your Quest
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/sign-in" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 px-10 text-lg rounded-2xl font-black uppercase tracking-widest border-2 hover:bg-card/50 transition-all">
                Existing Player
              </Button>
            </Link>
          </motion.div>

          {/* Feature Grid */}
          <motion.div 
            variants={fadeInUp}
            className="mt-32 grid grid-cols-1 gap-6 sm:grid-cols-3 text-left"
          >
            {[
              {
                title: "Adaptive Battles",
                desc: "Real-time AI difficulty adjustment that identifies your exact skill gaps.",
                icon: Target,
                color: "text-sky-500",
                bg: "bg-sky-500/10",
                border: "border-sky-500/20"
              },
              {
                title: "Magic Explainer",
                desc: "Interactive whiteboard lessons that build deep conceptual understanding.",
                icon: Brain,
                color: "text-athena-amber",
                bg: "bg-athena-amber/10",
                border: "border-athena-amber/20"
              },
              {
                title: "Rank Momentum",
                desc: "RPG-inspired progression tracking to keep your motivation high.",
                icon: Trophy,
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                border: "border-emerald-500/20"
              },
            ].map((f) => (
              <motion.div
                key={f.title}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`group relative rounded-3xl border ${f.border} bg-card/40 p-8 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${f.bg} border ${f.border} transition-transform group-hover:rotate-12`}>
                  <f.icon className={`h-7 w-7 ${f.color}`} />
                </div>
                <h3 className="mb-2 text-xl font-black uppercase tracking-tight text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground/80 leading-relaxed font-medium">{f.desc}</p>
                
                {/* Decorative dots */}
                <div className="absolute top-4 right-4 opacity-10">
                   <Zap className="h-12 w-12" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-border/30 bg-background/50 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold uppercase tracking-widest opacity-80">Athena Learning</span>
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            &copy; 2026 Athena &mdash; Built for students who show up.
          </p>
          <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
             <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
             <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
             <Link href="#" className="hover:text-primary transition-colors">Discord</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

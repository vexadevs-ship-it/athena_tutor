"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  BookOpen,
  Brain,
  Home,
  Trophy,
  UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "ATHENA", icon: Home },
  { href: "/queue", label: "PROGRESS", icon: Trophy },
  { href: "/learning", label: "REVIEW", icon: BookOpen },
  // { href: "/full-sat", label: "SAT TEST" },
  { href: "/mentor", label: "MENTOR", icon: Bot },
  { href: "/profile", label: "PROFILE", icon: UserCircle2 },
  { href: "/my-learning", label: "LEARN", icon: Brain },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/15 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2 sm:px-6">
        <div className="hidden sm:block" />

        <nav className="col-span-3 row-2 flex w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-white/20 bg-background/70 p-1.5 shadow-[0_10px_30px_rgba(2,132,199,0.12)] sm:col-span-1 sm:col-start-2 sm:row-1 sm:w-auto sm:rounded-full sm:px-2 sm:py-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "relative inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-full px-2.5 py-2 text-[11px] font-semibold transition-all sm:px-3",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(2,132,199,0.35)]"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap sm:tracking-[0.16em]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="col-span-3 row-1 ml-auto flex items-center gap-1 sm:col-span-1 sm:col-start-3 sm:ml-0 sm:justify-self-end">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

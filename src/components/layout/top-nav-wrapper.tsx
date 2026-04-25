"use client";

import { usePathname } from "next/navigation";
import { TopNav } from "./top-nav";

export function TopNavWrapper() {
  const pathname = usePathname();

  if (pathname.startsWith("/onboarding")) return null;
  if (pathname.includes("/micro-lesson")) return null;

  return <TopNav />;
}

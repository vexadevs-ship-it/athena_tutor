import { TopNavWrapper } from "@/components/layout/top-nav-wrapper";
import { CursorGlow } from "@/components/layout/cursor-glow";
import { ParticlesBackground } from "@/components/particles-background";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <ParticlesBackground />
      <CursorGlow />
      <TopNavWrapper />
      <main className="flex-1 min-h-0 flex flex-col relative z-10">{children}</main>
    </div>
  );
}

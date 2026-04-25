import { LandingContent } from "@/components/landing/landing-content";
import { ParticlesBackground } from "@/components/particles-background";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen">
      <ParticlesBackground />
      <LandingContent />
    </div>
  );
}

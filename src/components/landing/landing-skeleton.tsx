import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";

export function LandingSkeleton() {
  return (
    <div className="relative min-h-screen flex flex-col px-6">
      <header className="flex items-center justify-between py-6 md:px-6">
        <div className="flex items-center gap-3">
          <SkeletonShimmer className="h-10 w-10 rounded-xl" />
          <SkeletonShimmer className="h-6 w-24 rounded-lg" />
        </div>
        <div className="flex items-center gap-4">
          <SkeletonShimmer className="h-8 w-16 rounded-lg" />
          <SkeletonShimmer className="h-10 w-32 rounded-xl" />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center text-center space-y-10 pt-12 pb-24">
        <SkeletonShimmer className="h-8 w-48 rounded-full" />
        
        <div className="space-y-4">
          <SkeletonShimmer className="h-20 w-full max-w-2xl mx-auto rounded-2xl md:h-32" />
          <SkeletonShimmer className="h-20 w-3/4 max-w-xl mx-auto rounded-2xl md:h-32" />
        </div>

        <SkeletonShimmer className="h-6 w-full max-w-md mx-auto rounded-lg" />

        <div className="flex flex-col sm:flex-row gap-4">
          <SkeletonShimmer className="h-16 w-48 rounded-2xl" />
          <SkeletonShimmer className="h-16 w-48 rounded-2xl" />
        </div>

        <div className="mt-24 grid grid-cols-1 gap-6 sm:grid-cols-3 w-full max-w-4xl">
          <SkeletonShimmer className="h-56 rounded-3xl" />
          <SkeletonShimmer className="h-56 rounded-3xl" />
          <SkeletonShimmer className="h-56 rounded-3xl" />
        </div>
      </main>
    </div>
  );
}

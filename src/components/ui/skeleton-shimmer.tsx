import { cn } from "@/lib/utils";

type SkeletonShimmerProps = {
  className?: string;
};

export function SkeletonShimmer({ className }: SkeletonShimmerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted/60",
        "before:absolute before:inset-0 before:animate-[shimmer_1.6s_infinite] before:bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.35)_50%,transparent_70%)] before:bg-[length:200%_100%]",
        className,
      )}
      aria-hidden="true"
    />
  );
}

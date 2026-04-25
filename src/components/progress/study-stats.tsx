"use client";

type Stats = {
  totalQuestions: number;
  accuracy: number;
  totalTimeSeconds: number;
  sessionCount: number;
  avgScore: number;
};

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function StudyStats({ stats }: { stats: Stats }) {
  const avgMinutes =
    stats.sessionCount > 0
      ? Math.round(stats.totalTimeSeconds / stats.sessionCount / 60)
      : 0;

  return (
    <div>
      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
        Study Stats
      </h2>

      <div className="mt-3 rounded-2xl border border-emerald-300/30 bg-gradient-to-br from-emerald-100/70 to-cyan-100/30 p-4 dark:from-emerald-500/10 dark:to-cyan-500/5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sessions Completed</p>
        <p className="mt-1 text-4xl font-black tabular-nums text-foreground">
          {stats.sessionCount}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/60 bg-background/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Accuracy</p>
          <p className="mt-1 text-xl font-black tabular-nums">{Math.round(stats.accuracy)}%</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Questions</p>
          <p className="mt-1 text-xl font-black tabular-nums">{stats.totalQuestions}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Time</p>
          <p className="mt-1 text-base font-bold tabular-nums">{formatDuration(stats.totalTimeSeconds)}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg Session</p>
          <p className="mt-1 text-base font-bold tabular-nums">{avgMinutes} min</p>
        </div>
      </div>
    </div>
  );
}

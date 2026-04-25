"use client";

type Session = {
  id: string;
  subtopicName: string;
  score: number;
  totalQuestions: number;
  timeElapsedSeconds: number;
  date: string;
};

export function PracticeTestResults({
  sessions,
}: {
  sessions: Session[];
}) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-sky-300/35 bg-gradient-to-br from-sky-100/50 to-cyan-100/20 p-6 text-center dark:from-sky-500/10 dark:to-cyan-500/5">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          Practice Test Results
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          No practice sessions yet.
        </p>
      </div>
    );
  }

  const displayed = sessions.slice(0, 5);

  return (
    <div>
      <h2 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
        Practice Test Results
      </h2>
      <div className="space-y-2">
        {displayed.map((session, idx) => {
          const date = new Date(session.date);
          const dateStr = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          const pct =
            session.totalQuestions > 0
              ? Math.round(
                  (session.score / session.totalQuestions) * 100
                )
              : 0;

          return (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-xl border border-border/55 bg-background/70 px-4 py-3.5"
            >
              <div>
                <p className="text-sm font-bold">Session {idx + 1}</p>
                <p className="text-xs text-muted-foreground">
                  {dateStr} &middot; {session.subtopicName}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black tabular-nums">
                  {session.score}/{session.totalQuestions}
                </span>
                <p className="text-xs font-semibold text-muted-foreground">{pct}% accuracy</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

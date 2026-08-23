import { useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { SessionRow } from "@/components/domain/SessionRow";
import { TrialDetailDrawer } from "@/components/domain/TrialDetailDrawer";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/hooks/useToast";
import { sessionService } from "@/services";
import { monthMatrix, toISODate, todayISO } from "@/lib/date";
import { cn } from "@/lib/cn";
import type { Session } from "@/domain/types";

export function SchedulePage() {
  const { push } = useToast();
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reviewSession, setReviewSession] = useState<Session | null>(null);

  const year = cursor.getFullYear();
  const monthIndex = cursor.getMonth();
  const weeks = useMemo(() => monthMatrix(year, monthIndex), [year, monthIndex]);

  const rangeStart = toISODate(new Date(year, monthIndex, 1));
  const rangeEnd = toISODate(new Date(year, monthIndex + 1, 0));
  const state = useAsync(() => sessionService.listSessions({ startDate: rangeStart, endDate: rangeEnd }), [rangeStart, rangeEnd]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of state.data ?? []) {
      const list = map.get(s.sessionDate) ?? [];
      list.push(s);
      map.set(s.sessionDate, list);
    }
    return map;
  }, [state.data]);

  const upcoming = useMemo(
    () => (state.data ?? []).filter((s) => s.status === "scheduled" && s.sessionDate >= todayISO()).slice(0, 6),
    [state.data],
  );

  const daySessions = selectedDate ? (sessionsByDate.get(selectedDate) ?? []) : [];

  async function handleCancel(session: Session) {
    await sessionService.cancelSession(session.id);
    push({ kind: "success", title: "Session cancelled", description: `${session.studentName}'s session was cancelled.` });
    state.refetch();
  }

  return (
    <div>
      <PageHeader title="My Schedule" description="Your monthly calendar of classes and trial sessions." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>
              {cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </CardTitle>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCursor(new Date(year, monthIndex - 1, 1))}
                aria-label="Previous month"
                className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => setCursor(new Date())}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
              >
                Today
              </button>
              <button
                onClick={() => setCursor(new Date(year, monthIndex + 1, 1))}
                aria-label="Next month"
                className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </CardHeader>
          <CardBody>
            {state.loading ? (
              <CardSkeleton rows={6} />
            ) : selectedDate ? (
              <div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)} className="mb-3">
                  <ArrowLeft className="size-4" /> Back to month view
                </Button>
                <p className="mb-3 font-display text-sm font-semibold text-ink-800 dark:text-ink-100">
                  {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                {daySessions.length === 0 ? (
                  <EmptyState title="No sessions on this day" />
                ) : (
                  <div className="space-y-3">
                    {daySessions.map((s) => (
                      <SessionRow
                        key={s.id}
                        session={s}
                        onReview={s.recordType === "trial" ? setReviewSession : undefined}
                        onCancel={s.status === "scheduled" ? handleCancel : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-ink-400 dark:text-ink-500">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} className="py-2">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {weeks.flat().map((date, i) => {
                    if (!date) return <div key={i} />;
                    const iso = toISODate(date);
                    const count = sessionsByDate.get(iso)?.length ?? 0;
                    const isToday = iso === todayISO();
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(iso)}
                        className={cn(
                          "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-medium transition-colors hover:bg-ink-100 dark:hover:bg-ink-800",
                          isToday && "ring-2 ring-brand-500",
                          "text-ink-700 dark:text-ink-200",
                        )}
                      >
                        <span>{date.getDate()}</span>
                        {count > 0 && (
                          <span className="rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {state.loading ? (
              <CardSkeleton rows={3} />
            ) : upcoming.length === 0 ? (
              <EmptyState title="Nothing scheduled" description="No upcoming classes this month." />
            ) : (
              upcoming.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  onReview={s.recordType === "trial" ? setReviewSession : undefined}
                  onCancel={handleCancel}
                />
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <TrialDetailDrawer session={reviewSession} onClose={() => setReviewSession(null)} />
    </div>
  );
}

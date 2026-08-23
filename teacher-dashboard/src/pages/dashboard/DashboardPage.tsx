import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, PianoIcon, Sparkles, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { SessionRow } from "@/components/domain/SessionRow";
import { HealthScoreCard } from "@/components/domain/HealthScoreCard";
import { TrialDetailDrawer } from "@/components/domain/TrialDetailDrawer";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/hooks/useToast";
import { batchService, healthService, notificationService, sessionService, studentService, trialService } from "@/services";
import type { Session } from "@/domain/types";
import { addDaysISO, formatFullDate, todayISO } from "@/lib/date";
import { relativeFromNow } from "@/lib/date";
import { teacher } from "@/mocks/seed";

export function DashboardPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [reviewSession, setReviewSession] = useState<Session | null>(null);

  const healthState = useAsync(() => healthService.getHealthScore(), []);
  const batchesState = useAsync(() => batchService.listBatches(), []);
  const studentsState = useAsync(() => studentService.listStudents(), []);
  const opportunitiesState = useAsync(() => trialService.listOpportunities(), []);
  const notificationsState = useAsync(() => notificationService.listNotifications(), []);
  const sessionsState = useAsync(
    () => sessionService.listSessions({ startDate: todayISO(), endDate: addDaysISO(new Date(), 7) }),
    [],
  );

  const upcoming = useMemo(
    () => (sessionsState.data ?? []).filter((s) => s.status === "scheduled").slice(0, 5),
    [sessionsState.data],
  );
  const activeBatches = useMemo(() => (batchesState.data ?? []).filter((b) => b.status === "active"), [batchesState.data]);
  const unreadNotifications = useMemo(
    () => (notificationsState.data ?? []).filter((n) => !n.read),
    [notificationsState.data],
  );

  async function handleCancel(session: Session) {
    await sessionService.cancelSession(session.id);
    push({ kind: "success", title: "Session cancelled", description: `${session.studentName}'s session was cancelled.` });
    sessionsState.refetch();
  }

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${teacher.name.split(" ")[0]}`}
        description={formatFullDate(todayISO())}
        actions={
          <Button variant="outline" onClick={() => navigate("/dashboard/schedule")}>
            <CalendarDays className="size-4" /> View schedule
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active batches" value={String(activeBatches.length)} icon={PianoIcon} tone="brand" />
        <StatCard label="Total students" value={String((studentsState.data ?? []).length)} icon={Users} tone="accent" />
        <StatCard
          label="Trial opportunities"
          value={String((opportunitiesState.data ?? []).length)}
          icon={Sparkles}
          tone="success"
        />
        <StatCard label="Needs attention" value={String(unreadNotifications.length)} icon={CalendarDays} tone="neutral" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          {healthState.loading || !healthState.data ? <CardSkeleton rows={4} /> : <HealthScoreCard health={healthState.data} />}

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Classes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/schedule")}>
                View calendar
              </Button>
            </CardHeader>
            <CardBody>
              {sessionsState.loading ? (
                <TableSkeleton rows={3} cols={3} />
              ) : upcoming.length === 0 ? (
                <EmptyState title="No classes in the next 7 days" description="Enjoy the downtime, or check your availability to open up more slots." />
              ) : (
                <div className="space-y-3">
                  {upcoming.map((session) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      onReview={session.recordType === "trial" ? setReviewSession : undefined}
                      onCancel={handleCancel}
                    />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trial Opportunities</CardTitle>
              <Badge tone="warning">{(opportunitiesState.data ?? []).length} open</Badge>
            </CardHeader>
            <CardBody>
              {opportunitiesState.loading ? (
                <TableSkeleton rows={2} cols={2} />
              ) : (opportunitiesState.data ?? []).length === 0 ? (
                <EmptyState title="No open trial slots right now" />
              ) : (
                <div className="space-y-3">
                  {(opportunitiesState.data ?? []).slice(0, 3).map((opp) => (
                    <div key={opp.id} className="rounded-xl border border-ink-100 p-3 text-sm dark:border-ink-800">
                      <p className="font-semibold text-ink-900 dark:text-white">{opp.studentName}</p>
                      <p className="text-ink-500 dark:text-ink-400">
                        {opp.courseTitle} · {opp.ageGroup}
                      </p>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/dashboard/trials/opportunities")}>
                    Review all opportunities
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Needs Attention</CardTitle>
            </CardHeader>
            <CardBody>
              {notificationsState.loading ? (
                <TableSkeleton rows={3} cols={1} />
              ) : unreadNotifications.length === 0 ? (
                <EmptyState title="You're all caught up" description="No pending items right now." />
              ) : (
                <div className="space-y-3">
                  {unreadNotifications.slice(0, 4).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => n.actionRoute && navigate(n.actionRoute)}
                      className="block w-full rounded-xl border border-ink-100 p-3 text-left text-sm hover:border-brand-200 dark:border-ink-800 dark:hover:border-brand-800/60"
                    >
                      <p className="font-semibold text-ink-900 dark:text-white">{n.title}</p>
                      <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{n.description}</p>
                      <p className="mt-1 text-[11px] text-ink-400 dark:text-ink-500">{relativeFromNow(n.createdAt)}</p>
                    </button>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate("/dashboard/notifications")}>
                    View all
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <TrialDetailDrawer session={reviewSession} onClose={() => setReviewSession(null)} />
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

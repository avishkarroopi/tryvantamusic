import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CalendarDays, Flame, Trophy } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { SessionRow } from "@/components/domain/SessionRow";
import { useAsync } from "@/hooks/useAsync";
import { enrollmentService, practiceService, achievementService, notificationService, sessionService } from "@/services";
import { addDaysISO, relativeFromNow, formatFullDate, todayISO } from "@/lib/date";
import { student } from "@/mocks/seed";

export function DashboardPage() {
  const navigate = useNavigate();

  const enrollmentsState = useAsync(() => enrollmentService.listEnrollments(), []);
  const streakState = useAsync(() => practiceService.currentStreakDays(), []);
  const achievementsState = useAsync(() => achievementService.listAchievements(), []);
  const notificationsState = useAsync(() => notificationService.listNotifications(), []);
  const sessionsState = useAsync(
    () => sessionService.listSessions({ startDate: todayISO(), endDate: addDaysISO(new Date(), 7) }),
    [],
  );

  const upcoming = useMemo(
    () => (sessionsState.data ?? []).filter((s) => s.status === "scheduled").slice(0, 5),
    [sessionsState.data],
  );
  const activeEnrollments = useMemo(
    () => (enrollmentsState.data ?? []).filter((e) => e.status === "active"),
    [enrollmentsState.data],
  );
  const unreadNotifications = useMemo(
    () => (notificationsState.data ?? []).filter((n) => !n.read),
    [notificationsState.data],
  );

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${student.name.split(" ")[0]}`}
        description={formatFullDate(todayISO())}
        actions={
          <Button variant="outline" onClick={() => navigate("/dashboard/schedule")}>
            <CalendarDays className="size-4" /> View schedule
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active classes" value={String(activeEnrollments.length)} icon={BookOpen} tone="brand" />
        <StatCard
          label="Practice streak"
          value={streakState.data !== undefined ? `${streakState.data} day${streakState.data === 1 ? "" : "s"}` : "…"}
          icon={Flame}
          tone="accent"
        />
        <StatCard label="Achievements" value={String((achievementsState.data ?? []).length)} icon={Trophy} tone="success" />
        <StatCard label="Needs attention" value={String(unreadNotifications.length)} icon={CalendarDays} tone="neutral" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
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
                <EmptyState title="No classes in the next 7 days" description="Enjoy the downtime, or check your schedule for later dates." />
              ) : (
                <div className="space-y-3">
                  {upcoming.map((session) => (
                    <SessionRow key={session.id} session={session} />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Classes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/classes")}>
                View all
              </Button>
            </CardHeader>
            <CardBody>
              {enrollmentsState.loading ? (
                <TableSkeleton rows={2} cols={3} />
              ) : activeEnrollments.length === 0 ? (
                <EmptyState title="No active classes yet" />
              ) : (
                <div className="space-y-3">
                  {activeEnrollments.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between rounded-xl border border-ink-100 p-3 text-sm dark:border-ink-800"
                    >
                      <div>
                        <p className="font-semibold text-ink-900 dark:text-white">{e.batchName}</p>
                        <p className="text-ink-500 dark:text-ink-400">
                          {e.teacherName} · {e.currentLevel}
                        </p>
                      </div>
                      <div className="w-28 shrink-0">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${e.progressPercent}%` }} />
                        </div>
                        <p className="mt-1 text-right text-[11px] text-ink-400 dark:text-ink-500">{e.progressPercent}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
            </CardHeader>
            <CardBody>
              {achievementsState.loading ? (
                <TableSkeleton rows={2} cols={1} />
              ) : (achievementsState.data ?? []).length === 0 ? (
                <EmptyState title="No achievements yet" description="Keep practicing to earn your first badge!" />
              ) : (
                <div className="space-y-3">
                  {(achievementsState.data ?? []).slice(0, 3).map((a) => (
                    <div key={a.id} className="rounded-xl border border-ink-100 p-3 text-sm dark:border-ink-800">
                      <p className="font-semibold text-ink-900 dark:text-white">{a.title}</p>
                      <p className="text-ink-500 dark:text-ink-400">{a.description}</p>
                      <p className="mt-1 text-[11px] text-ink-400 dark:text-ink-500">{relativeFromNow(a.earnedAt)}</p>
                    </div>
                  ))}
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
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

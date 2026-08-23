import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CalendarClock, Clock, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAsync } from "@/hooks/useAsync";
import { batchService, studentService } from "@/services";
import type { BatchStatus } from "@/domain/types";

const STATUS_TONE: Record<BatchStatus, BadgeTone> = {
  active: "success",
  paused: "warning",
  inactive: "neutral",
  completed: "brand",
};

export function BatchDetailPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const batchState = useAsync(() => batchService.getBatch(batchId!), [batchId]);
  const studentsState = useAsync(() => studentService.listStudents(), []);

  if (batchState.loading) return <CardSkeleton rows={6} />;
  if (batchState.error) return <ErrorState message={batchState.error.message} onRetry={batchState.refetch} />;
  if (!batchState.data) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-ink-500 dark:text-ink-400">Batch not found.</p>
          <Link to="/dashboard/batches" className="mt-2 inline-block text-sm font-semibold text-brand-600">
            Back to Batches
          </Link>
        </CardBody>
      </Card>
    );
  }

  const batch = batchState.data;
  const students = (studentsState.data ?? []).filter((s) => batch.studentIds.includes(s.id));

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3">
        <ArrowLeft className="size-4" /> Back
      </Button>
      <PageHeader
        title={batch.name}
        description={`Started ${new Date(batch.startedOn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
        actions={
          <Badge tone={STATUS_TONE[batch.status]} className="text-sm capitalize">
            {batch.status}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <Users className="size-5" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-ink-900 dark:text-white">{batch.studentIds.length}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">Students</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-300">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-ink-900 dark:text-white">{batch.totalHoursDelivered}h</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">Hours delivered</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
              <CalendarClock className="size-5" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-ink-900 dark:text-white">{batch.totalSessionsDelivered}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">Sessions delivered</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly schedule</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            {batch.schedule.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-2.5 text-sm dark:border-ink-800">
                <span className="font-semibold text-ink-800 dark:text-ink-100">{s.day}</span>
                <span className="text-ink-500 dark:text-ink-400">
                  {s.startTime} – {s.endTime}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            {students.map((s) => (
              <Link
                key={s.id}
                to={`/dashboard/students/${s.id}`}
                className="flex items-center gap-3 rounded-xl border border-ink-100 p-2.5 hover:border-brand-200 dark:border-ink-800 dark:hover:border-brand-800/60"
              >
                <Avatar name={s.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-ink-400 dark:text-ink-500">{s.ageGroup}</p>
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

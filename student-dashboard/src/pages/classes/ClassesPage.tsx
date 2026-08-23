import { useState } from "react";
import { CalendarDays, Music2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/hooks/useToast";
import { enrollmentService, practiceService } from "@/services";
import { formatFriendlyDate } from "@/lib/date";
import type { Enrollment, EnrollmentStatus } from "@/domain/types";

const STATUS_TONE: Record<EnrollmentStatus, BadgeTone> = {
  active: "success",
  paused: "warning",
  completed: "brand",
};

export function ClassesPage() {
  const state = useAsync(() => enrollmentService.listEnrollments(), []);
  const { push } = useToast();
  const [logTarget, setLogTarget] = useState<Enrollment | null>(null);
  const [minutes, setMinutes] = useState(15);
  const [saving, setSaving] = useState(false);

  async function handleLogPractice() {
    if (!logTarget) return;
    setSaving(true);
    await practiceService.logPractice(minutes, logTarget.instrument);
    setSaving(false);
    setLogTarget(null);
    push({ kind: "success", title: "Practice logged", description: `${minutes} minutes added to today's log.` });
  }

  return (
    <div>
      <PageHeader title="My Classes" description="Your enrolled batches, teachers, and progress." />

      <DataState
        state={state}
        skeleton={<TableSkeleton rows={3} cols={3} />}
        isEmpty={(d) => d.length === 0}
        empty={<Card><EmptyState title="No classes yet" description="Enroll in a course to see it here." /></Card>}
      >
        {(enrollments) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {enrollments.map((e) => (
              <Card key={e.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display font-semibold text-ink-900 dark:text-white">{e.batchName}</p>
                      <p className="mt-0.5 text-xs capitalize text-ink-400 dark:text-ink-500">{e.instrument} · {e.currentLevel}</p>
                    </div>
                    <Badge tone={STATUS_TONE[e.status]} className="capitalize">
                      {e.status}
                    </Badge>
                  </div>

                  <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">with {e.teacherName}</p>

                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${e.progressPercent}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-ink-400 dark:text-ink-500">{e.progressPercent}% through this level</p>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-sm text-ink-500 dark:text-ink-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Music2 className="size-4" /> {e.totalSessionsCompleted} sessions
                    </span>
                  </div>

                  {e.nextSessionAt && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-400 dark:text-ink-500">
                      <CalendarDays className="size-3.5" /> Next: {formatFriendlyDate(e.nextSessionAt)}
                    </p>
                  )}

                  <Button size="sm" variant="outline" className="mt-4 w-full" onClick={() => setLogTarget(e)}>
                    Log practice time
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </DataState>

      <Modal
        open={!!logTarget}
        onClose={() => setLogTarget(null)}
        title="Log practice time"
        footer={
          <>
            <Button variant="outline" onClick={() => setLogTarget(null)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleLogPractice}>
              Save
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-500 dark:text-ink-400">
          How many minutes did you practice {logTarget?.instrument} today?
        </p>
        <input
          type="number"
          min={1}
          max={240}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-ink-700 dark:bg-ink-950 dark:text-white dark:focus:ring-brand-500/20"
        />
      </Modal>
    </div>
  );
}

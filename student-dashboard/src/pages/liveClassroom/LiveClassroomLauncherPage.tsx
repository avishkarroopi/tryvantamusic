import { useNavigate } from "react-router-dom";
import { Radio, Video } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { enrollmentService } from "@/services";
import { MCAM_ENABLED } from "@/mcam/integration/config";
import { mcamSessionIdForBatch } from "@/mcam/integration/mcamClassroom";
import type { Enrollment, EnrollmentStatus } from "@/domain/types";

const STATUS_TONE: Record<EnrollmentStatus, BadgeTone> = {
  active: "success",
  paused: "warning",
  completed: "brand",
};

/**
 * Live Classroom launcher — the Student Dashboard's entry point into M-CAM.
 * Lists your enrolled classes and joins the real-time classroom for one, via
 * the same integration layer the Teacher Dashboard uses (`@/mcam/integration`).
 *
 * NOTE (mock-data phase): this app and the Teacher Dashboard run on two
 * independently seeded local mock stores, so a student's enrollment id and a
 * teacher's batch id are not the same value here — joining derives its own
 * room id from the enrollment id, so a student in this demo won't land in
 * the same M-CAM room as a teacher's demo session. In a real deployment both
 * sides would resolve the same *actual* batch id from the shared Muziclly
 * backend, and this room-id derivation is exactly the seam that would use it
 * (see `mcamSessionIdForBatch`) — no other code changes needed.
 */
export function LiveClassroomLauncherPage() {
  const navigate = useNavigate();
  const state = useAsync(() => enrollmentService.listEnrollments(), []);

  if (!MCAM_ENABLED) {
    return (
      <div>
        <PageHeader title="Live Classroom" description="Real-time classroom, chat and whiteboard, powered by M-CAM." />
        <Card>
          <EmptyState
            icon={<Video className="size-6" />}
            title="Live Classroom is not configured"
            description="Set VITE_MCAM_API_BASE / VITE_MCAM_WS_BASE to point at a running M-CAM backend to enable this module."
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Live Classroom"
        description="Join the real-time classroom for one of your enrolled classes — video, chat, and whiteboard in one room."
      />

      <DataState
        state={state}
        skeleton={<TableSkeleton rows={4} cols={3} />}
        isEmpty={(d) => d.length === 0}
        empty={
          <Card>
            <EmptyState title="No classes yet" description="Enroll in a course first, then join its live classroom here." />
          </Card>
        }
      >
        {(enrollments) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {enrollments.map((e) => (
              <EnrollmentLaunchCard
                key={e.id}
                enrollment={e}
                onLaunch={() => navigate(`/dashboard/live-classroom/${e.id}`)}
              />
            ))}
          </div>
        )}
      </DataState>
    </div>
  );
}

function EnrollmentLaunchCard({ enrollment, onLaunch }: { enrollment: Enrollment; onLaunch: () => void }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display font-semibold text-ink-900 dark:text-white">{enrollment.batchName}</p>
            <p className="mt-0.5 text-xs capitalize text-ink-400 dark:text-ink-500">{enrollment.instrument}</p>
          </div>
          <Badge tone={STATUS_TONE[enrollment.status]} className="capitalize">
            {enrollment.status}
          </Badge>
        </div>

        <p className="mt-4 text-sm text-ink-500 dark:text-ink-400">with {enrollment.teacherName}</p>

        <p className="mt-3 truncate text-xs text-ink-400 dark:text-ink-500">
          Room: {mcamSessionIdForBatch(enrollment.id)}
        </p>

        <Button size="sm" className="mt-4 w-full" onClick={onLaunch}>
          <Radio className="size-4" /> Join Live Classroom
        </Button>
      </CardBody>
    </Card>
  );
}

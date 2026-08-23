import { useNavigate } from "react-router-dom";
import { Radio, Users, Video } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { batchService } from "@/services";
import { MCAM_ENABLED } from "@/mcam/integration/config";
import { mcamSessionIdForBatch } from "@/mcam/integration/mcamClassroom";
import type { Batch, BatchStatus } from "@/domain/types";

const STATUS_TONE: Record<BatchStatus, BadgeTone> = {
  active: "success",
  paused: "warning",
  inactive: "neutral",
  completed: "brand",
};

/**
 * Live Classroom launcher — the Dashboard-side entry point into M-CAM.
 * Lists your batches and starts (or rejoins) a real-time classroom session
 * for one, via the integration layer in `@/mcam/integration`. This page
 * stays in the Dashboard's own visual language; the room itself switches to
 * M-CAM's "Stage & Signal" theatre theme (see LiveClassroomRoomPage).
 */
export function LiveClassroomLauncherPage() {
  const navigate = useNavigate();
  const state = useAsync(() => batchService.listBatches(), []);

  if (!MCAM_ENABLED) {
    return (
      <div>
        <PageHeader title="Live Classroom" description="Real-time classroom, whiteboard, studio and teaching tools, powered by M-CAM." />
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
        description="Start a real-time classroom for one of your batches — video, chat, whiteboard, studio and teaching tools in one room."
      />

      <DataState
        state={state}
        skeleton={<TableSkeleton rows={4} cols={3} />}
        isEmpty={(d) => d.length === 0}
        empty={
          <Card>
            <EmptyState title="No batches yet" description="Create a batch first, then start a live classroom for it." />
          </Card>
        }
      >
        {(batches) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {batches.map((batch) => (
              <BatchLaunchCard
                key={batch.id}
                batch={batch}
                onLaunch={() => navigate(`/dashboard/live-classroom/${batch.id}`)}
              />
            ))}
          </div>
        )}
      </DataState>
    </div>
  );
}

function BatchLaunchCard({ batch, onLaunch }: { batch: Batch; onLaunch: () => void }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display font-semibold text-ink-900 dark:text-white">{batch.name}</p>
            <p className="mt-0.5 text-xs capitalize text-ink-400 dark:text-ink-500">{batch.instrument}</p>
          </div>
          <Badge tone={STATUS_TONE[batch.status]} className="capitalize">
            {batch.status}
          </Badge>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-ink-500 dark:text-ink-400">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" /> {batch.studentIds.length} students
          </span>
        </div>

        <p className="mt-3 truncate text-xs text-ink-400 dark:text-ink-500">
          Room: {mcamSessionIdForBatch(batch.id)}
        </p>

        <Button size="sm" className="mt-4 w-full" onClick={onLaunch}>
          <Radio className="size-4" /> Start / Join Live Classroom
        </Button>
      </CardBody>
    </Card>
  );
}

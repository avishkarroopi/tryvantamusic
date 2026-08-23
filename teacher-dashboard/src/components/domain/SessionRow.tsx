import { Clock, Sparkles, Video } from "lucide-react";
import type { Session } from "@/domain/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatFriendlyDate, formatTimeRange } from "@/lib/date";

const STATUS_TONE = {
  scheduled: "brand",
  completed: "success",
  cancelled: "danger",
  "no-show": "warning",
} as const;

export function SessionRow({
  session,
  onReview,
  onCancel,
}: {
  session: Session;
  onReview?: (session: Session) => void;
  onCancel?: (session: Session) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ink-100 p-4 transition-colors hover:border-brand-200 dark:border-ink-800 dark:hover:border-brand-800/60 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={session.studentName} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink-900 dark:text-white">{session.studentName}</p>
            {session.recordType === "trial" && (
              <Badge tone="warning">
                <Sparkles className="size-3" /> Trial
              </Badge>
            )}
            <Badge tone={STATUS_TONE[session.status]}>{session.status}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{session.batchName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400 dark:text-ink-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {formatFriendlyDate(session.sessionDate)} ·{" "}
              {formatTimeRange(session.startTime, session.endTime)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Video className="size-3.5" /> Room {session.meetingRoomId}
            </span>
          </div>
        </div>
      </div>
      {session.status === "scheduled" && (
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
          {session.recordType === "trial" && onReview && (
            <Button size="sm" variant="outline" onClick={() => onReview(session)}>
              Review trial details
            </Button>
          )}
          {onCancel && (
            <Button size="sm" variant="ghost" onClick={() => onCancel(session)}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

import { Clock, Video } from "lucide-react";
import type { Session } from "@/domain/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatFriendlyDate, formatTimeRange } from "@/lib/date";

const STATUS_TONE = {
  scheduled: "brand",
  completed: "success",
  cancelled: "danger",
  missed: "warning",
} as const;

export function SessionRow({ session }: { session: Session }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ink-100 p-4 transition-colors hover:border-brand-200 dark:border-ink-800 dark:hover:border-brand-800/60 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={session.teacherName} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink-900 dark:text-white">{session.teacherName}</p>
            <Badge tone={STATUS_TONE[session.status]} className="capitalize">
              {session.status}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{session.batchName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400 dark:text-ink-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {formatFriendlyDate(session.sessionDate)} ·{" "}
              {formatTimeRange(session.startTime, session.endTime)}
            </span>
            {session.hasRecording && (
              <span className="inline-flex items-center gap-1">
                <Video className="size-3.5" /> Recording available
              </span>
            )}
          </div>
          {session.notes && (
            <p className="mt-2 rounded-lg bg-ink-50 p-2 text-xs text-ink-500 dark:bg-ink-800 dark:text-ink-400">
              {session.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

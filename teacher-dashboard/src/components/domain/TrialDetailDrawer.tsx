import { BookOpen, Clock, MapPin, StickyNote, Video } from "lucide-react";
import type { Session } from "@/domain/types";
import { Drawer } from "@/components/ui/Drawer";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatFriendlyDate, formatTimeRange } from "@/lib/date";

export function TrialDetailDrawer({ session, onClose }: { session: Session | null; onClose: () => void }) {
  return (
    <Drawer open={!!session} onClose={onClose} title="Trial session details" description={session?.batchName}>
      {session && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Avatar name={session.studentName} size="lg" />
            <div>
              <p className="font-display text-lg font-bold text-ink-900 dark:text-white">{session.studentName}</p>
              <Badge tone="brand" className="mt-1 capitalize">
                {session.instrument}
              </Badge>
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 size-4 text-ink-400" />
              <div>
                <dt className="font-semibold text-ink-800 dark:text-ink-100">When</dt>
                <dd className="text-ink-500 dark:text-ink-400">
                  {formatFriendlyDate(session.sessionDate)} · {formatTimeRange(session.startTime, session.endTime)}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 text-ink-400" />
              <div>
                <dt className="font-semibold text-ink-800 dark:text-ink-100">Region</dt>
                <dd className="text-ink-500 dark:text-ink-400">{session.region}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Video className="mt-0.5 size-4 text-ink-400" />
              <div>
                <dt className="font-semibold text-ink-800 dark:text-ink-100">Meeting room</dt>
                <dd className="text-ink-500 dark:text-ink-400">{session.meetingRoomId}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen className="mt-0.5 size-4 text-ink-400" />
              <div>
                <dt className="font-semibold text-ink-800 dark:text-ink-100">Course</dt>
                <dd className="text-ink-500 dark:text-ink-400">{session.batchName}</dd>
              </div>
            </div>
            {session.notes && (
              <div className="flex items-start gap-3">
                <StickyNote className="mt-0.5 size-4 text-ink-400" />
                <div>
                  <dt className="font-semibold text-ink-800 dark:text-ink-100">Notes for the trial</dt>
                  <dd className="text-ink-500 dark:text-ink-400">{session.notes}</dd>
                </div>
              </div>
            )}
          </dl>
        </div>
      )}
    </Drawer>
  );
}

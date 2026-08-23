import { CalendarClock, MapPin } from "lucide-react";
import type { TrialOpportunity } from "@/domain/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatFriendlyDate, to12h } from "@/lib/date";

export function TrialOpportunityCard({
  opportunity,
  onClaim,
  onDecline,
  claiming,
}: {
  opportunity: TrialOpportunity;
  onClaim: (opportunity: TrialOpportunity) => void;
  onDecline: (opportunity: TrialOpportunity) => void;
  claiming?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ink-100 p-4 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={opportunity.studentName} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink-900 dark:text-white">{opportunity.studentName}</p>
            <Badge tone="neutral">{opportunity.ageGroup}</Badge>
            <Badge tone="brand">{opportunity.courseTitle}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400 dark:text-ink-500">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3.5" /> {formatFriendlyDate(opportunity.sessionDate)} ·{" "}
              {to12h(opportunity.startTime)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> Region {opportunity.region}
            </span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
        <Button size="sm" variant="ghost" onClick={() => onDecline(opportunity)} disabled={claiming}>
          Decline
        </Button>
        <Button size="sm" onClick={() => onClaim(opportunity)} loading={claiming}>
          Claim trial
        </Button>
      </div>
    </div>
  );
}

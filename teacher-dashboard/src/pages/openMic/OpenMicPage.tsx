import { useState } from "react";
import { CalendarDays, MapPin, Mic2, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/hooks/useToast";
import { eventService } from "@/services";
import { formatFriendlyDate, to12h } from "@/lib/date";

export function OpenMicPage() {
  const { push } = useToast();
  const state = useAsync(() => eventService.listOpenMicEvents(), []);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function toggle(id: string, name: string, willRegister: boolean) {
    setPendingId(id);
    try {
      await eventService.toggleOpenMicRegistration(id);
      push({ kind: "success", title: willRegister ? "You're on the list!" : "Registration cancelled", description: name });
      state.refetch();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Open Mic" description="Student showcase and open mic nights you can join or host." />

      {state.loading ? (
        <CardSkeleton rows={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(state.data ?? []).map((event) => {
            const full = event.slotsFilled >= event.slotsTotal;
            return (
              <Card key={event.id}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-300">
                      <Mic2 className="size-5" />
                    </div>
                    {event.isRegistered && <Badge tone="success">Registered</Badge>}
                    {!event.isRegistered && full && <Badge tone="danger">Full</Badge>}
                  </div>
                  <p className="mt-3 font-display font-semibold text-ink-900 dark:text-white">{event.title}</p>
                  <p className="text-sm text-ink-500 dark:text-ink-400">{event.theme}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400 dark:text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" /> {formatFriendlyDate(event.date)} · {to12h(event.startTime)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" /> {event.venue}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" /> {event.slotsFilled}/{event.slotsTotal}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={event.isRegistered ? "outline" : "primary"}
                    className="mt-4"
                    disabled={!event.isRegistered && full}
                    loading={pendingId === event.id}
                    onClick={() => toggle(event.id, event.title, !event.isRegistered)}
                  >
                    {event.isRegistered ? "Cancel registration" : full ? "Slots full" : "Reserve a slot"}
                  </Button>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

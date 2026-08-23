import { Mic2, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/hooks/useToast";
import { eventService } from "@/services";
import { formatFriendlyDate, to12h } from "@/lib/date";

export function OpenMicPage() {
  const state = useAsync(() => eventService.listOpenMics(), []);
  const { push } = useToast();

  async function register(id: string, title: string) {
    await eventService.registerOpenMic(id);
    push({ kind: "success", title: "You're on the lineup!", description: title });
    state.refetch();
  }

  return (
    <div>
      <PageHeader title="Open Mic" description="Perform live and share your progress with the Muziclly community." />

      <DataState
        state={state}
        skeleton={<TableSkeleton rows={2} cols={2} />}
        isEmpty={(d) => d.length === 0}
        empty={<Card><EmptyState icon={<Mic2 className="size-6" />} title="No open mic events scheduled" /></Card>}
      >
        {(events) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((e) => (
              <Card key={e.id}>
                <CardBody>
                  <p className="font-display font-semibold text-ink-900 dark:text-white">{e.title}</p>
                  <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">Theme: {e.theme}</p>
                  <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">
                    {formatFriendlyDate(e.date)} · {to12h(e.startTime)} · {e.venue}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-sm text-ink-500 dark:text-ink-400">
                    <Users className="size-4" /> {e.slotsFilled}/{e.slotsTotal} slots filled
                  </div>
                  {e.isRegistered ? (
                    <Badge tone="success" className="mt-4">
                      Registered
                    </Badge>
                  ) : (
                    <Button size="sm" className="mt-4 w-full" onClick={() => register(e.id, e.title)}>
                      Reserve a slot
                    </Button>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </DataState>
    </div>
  );
}

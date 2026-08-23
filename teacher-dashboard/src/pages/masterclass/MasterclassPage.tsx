import { useState } from "react";
import { CalendarDays, Trophy, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/hooks/useToast";
import { eventService } from "@/services";
import { formatFriendlyDate, to12h } from "@/lib/date";

export function MasterclassPage() {
  const { push } = useToast();
  const state = useAsync(() => eventService.listMasterclasses(), []);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function toggle(id: string, name: string, willRegister: boolean) {
    setPendingId(id);
    try {
      await eventService.toggleMasterclassRegistration(id);
      push({
        kind: "success",
        title: willRegister ? "Registered" : "Registration cancelled",
        description: `${name}`,
      });
      state.refetch();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Masterclass" description="Live masterclasses from featured artists and educators." />

      {state.loading ? (
        <CardSkeleton rows={4} />
      ) : (state.data ?? []).length === 0 ? (
        <Card>
          <EmptyState icon={<Trophy className="size-6" />} title="No masterclasses scheduled" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(state.data ?? []).map((mc) => (
            <Card key={mc.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                    <Trophy className="size-5" />
                  </div>
                  {mc.isRegistered && <Badge tone="success">Registered</Badge>}
                </div>
                <p className="mt-3 font-display font-semibold text-ink-900 dark:text-white">{mc.title}</p>
                <p className="text-sm text-ink-500 dark:text-ink-400">Hosted by {mc.host}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400 dark:text-ink-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5" /> {formatFriendlyDate(mc.date)} · {to12h(mc.startTime)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" /> {mc.seatsFilled}/{mc.seatsTotal} seats
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${(mc.seatsFilled / mc.seatsTotal) * 100}%` }}
                  />
                </div>
                <Button
                  size="sm"
                  variant={mc.isRegistered ? "outline" : "primary"}
                  className="mt-4"
                  loading={pendingId === mc.id}
                  onClick={() => toggle(mc.id, mc.title, !mc.isRegistered)}
                >
                  {mc.isRegistered ? "Cancel registration" : "Register"}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

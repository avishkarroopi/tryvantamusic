import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, ChevronRight, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { batchService } from "@/services";
import type { Batch, BatchStatus } from "@/domain/types";

const STATUS_TONE: Record<BatchStatus, BadgeTone> = {
  active: "success",
  paused: "warning",
  inactive: "neutral",
  completed: "brand",
};

type Filter = "all" | BatchStatus;

export function BatchesPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const state = useAsync(() => batchService.listBatches(), []);

  const filtered = useMemo(() => {
    const list = state.data ?? [];
    return filter === "all" ? list : list.filter((b) => b.status === filter);
  }, [state.data, filter]);

  const counts = useMemo(() => {
    const list = state.data ?? [];
    return {
      all: list.length,
      active: list.filter((b) => b.status === "active").length,
      paused: list.filter((b) => b.status === "paused").length,
      inactive: list.filter((b) => b.status === "inactive").length,
      completed: list.filter((b) => b.status === "completed").length,
    };
  }, [state.data]);

  return (
    <div>
      <PageHeader title="Batches" description="All your recurring batches, grouped by status." />

      <Tabs
        active={filter}
        onChange={setFilter}
        tabs={[
          { value: "all", label: "All", count: counts.all },
          { value: "active", label: "Active", count: counts.active },
          { value: "paused", label: "Paused", count: counts.paused },
          { value: "inactive", label: "Inactive", count: counts.inactive },
          { value: "completed", label: "Completed", count: counts.completed },
        ]}
      />

      <div className="mt-5">
        <DataState
          state={state}
          skeleton={<TableSkeleton rows={4} cols={4} />}
          isEmpty={() => filtered.length === 0}
          empty={
            <Card>
              <EmptyState
                title="No batches here yet"
                description="Batches you claim from won trials will show up in this list."
              />
            </Card>
          }
        >
          {() => (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((batch) => (
                <BatchCard key={batch.id} batch={batch} onClick={() => navigate(`/dashboard/batches/${batch.id}`)} />
              ))}
            </div>
          )}
        </DataState>
      </div>
    </div>
  );
}

function BatchCard({ batch, onClick }: { batch: Batch; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left">
      <Card className="h-full transition-shadow hover:shadow-pop">
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
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-4" /> {batch.totalHoursDelivered}h delivered
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {batch.schedule.map((s, i) => (
              <Badge key={i} tone="neutral">
                {s.day} {s.startTime}
              </Badge>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 text-sm font-semibold text-brand-600 dark:border-ink-800 dark:text-brand-400">
            View batch
            <ChevronRight className="size-4" />
          </div>
        </CardBody>
      </Card>
    </button>
  );
}

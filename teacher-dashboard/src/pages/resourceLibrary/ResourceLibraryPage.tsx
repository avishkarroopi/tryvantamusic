import { useMemo, useState } from "react";
import { FileAudio, FileText, FileVideo, Music, NotebookPen } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { resourceService } from "@/services";
import { formatFullDate } from "@/lib/date";
import type { Resource } from "@/domain/types";

const TYPE_ICON: Record<Resource["type"], typeof FileText> = {
  pdf: FileText,
  "sheet-music": Music,
  audio: FileAudio,
  video: FileVideo,
  worksheet: NotebookPen,
};

type Filter = "all" | Resource["type"];

export function ResourceLibraryPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const state = useAsync(() => resourceService.listResources(), []);

  const filtered = useMemo(() => {
    const list = state.data ?? [];
    return filter === "all" ? list : list.filter((r) => r.type === filter);
  }, [state.data, filter]);

  return (
    <div>
      <PageHeader title="Resource Library" description="Sheet music, worksheets, audio and video materials for your classes." />

      <Tabs
        active={filter}
        onChange={setFilter}
        tabs={[
          { value: "all", label: "All" },
          { value: "sheet-music", label: "Sheet music" },
          { value: "pdf", label: "PDFs" },
          { value: "audio", label: "Audio" },
          { value: "video", label: "Video" },
          { value: "worksheet", label: "Worksheets" },
        ]}
      />

      <div className="mt-5">
        <Card>
          <DataState
            state={state}
            skeleton={<TableSkeleton rows={4} cols={3} />}
            isEmpty={() => filtered.length === 0}
            empty={<EmptyState title="No resources in this category" />}
          >
            {() => (
              <CardBody className="space-y-2">
                {filtered.map((r) => {
                  const Icon = TYPE_ICON[r.type];
                  return (
                    <div key={r.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3 dark:border-ink-800">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink-900 dark:text-white">{r.title}</p>
                        <p className="text-xs text-ink-400 dark:text-ink-500">
                          {formatFullDate(r.updatedAt)} · {r.sizeLabel}
                        </p>
                      </div>
                      <Badge tone="neutral" className="capitalize">
                        {r.instrument}
                      </Badge>
                    </div>
                  );
                })}
              </CardBody>
            )}
          </DataState>
        </Card>
      </div>
    </div>
  );
}

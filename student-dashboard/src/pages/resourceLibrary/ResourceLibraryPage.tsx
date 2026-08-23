import { FileText, Music, Video, FileAudio, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { resourceService } from "@/services";
import { formatFriendlyDate } from "@/lib/date";
import type { Resource } from "@/domain/types";

const ICONS: Record<Resource["type"], typeof FileText> = {
  pdf: FileText,
  "sheet-music": Music,
  audio: FileAudio,
  video: Video,
  worksheet: FileSpreadsheet,
};

export function ResourceLibraryPage() {
  const state = useAsync(() => resourceService.listResources(), []);

  return (
    <div>
      <PageHeader title="Resource Library" description="Sheet music, practice sheets, and recordings shared by your teachers." />

      <DataState
        state={state}
        skeleton={<TableSkeleton rows={4} cols={2} />}
        isEmpty={(d) => d.length === 0}
        empty={<Card><EmptyState title="No resources yet" /></Card>}
      >
        {(resources) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {resources.map((r) => {
              const Icon = ICONS[r.type];
              return (
                <Card key={r.id}>
                  <CardBody className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-900 dark:text-white">{r.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge tone="neutral" className="capitalize">
                          {r.instrument}
                        </Badge>
                        <span className="text-xs text-ink-400 dark:text-ink-500">{r.sizeLabel}</span>
                      </div>
                      <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">Updated {formatFriendlyDate(r.updatedAt)}</p>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </DataState>
    </div>
  );
}

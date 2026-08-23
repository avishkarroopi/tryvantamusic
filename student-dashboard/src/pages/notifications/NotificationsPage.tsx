import { useNavigate } from "react-router-dom";
import { CheckCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { notificationService } from "@/services";
import { notifyAttentionChanged } from "@/hooks/useAttentionCounts";
import { relativeFromNow } from "@/lib/date";
import type { NotificationSeverity } from "@/domain/types";

const SEVERITY_TONE: Record<NotificationSeverity, BadgeTone> = {
  info: "brand",
  success: "success",
  warning: "warning",
  critical: "danger",
};

export function NotificationsPage() {
  const state = useAsync(() => notificationService.listNotifications(), []);
  const navigate = useNavigate();

  async function markAllRead() {
    await notificationService.markAllRead();
    notifyAttentionChanged();
    state.refetch();
  }

  async function markRead(id: string) {
    await notificationService.markRead(id);
    notifyAttentionChanged();
    state.refetch();
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Updates about your classes, messages, and achievements."
        actions={
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        }
      />

      <DataState
        state={state}
        skeleton={<TableSkeleton rows={5} cols={1} />}
        isEmpty={(d) => d.length === 0}
        empty={<Card><EmptyState title="No notifications" description="You're all caught up." /></Card>}
      >
        {(items) => (
          <div className="space-y-3">
            {items.map((n) => (
              <Card key={n.id} className={n.read ? "opacity-70" : ""}>
                <CardBody className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink-900 dark:text-white">{n.title}</p>
                      <Badge tone={SEVERITY_TONE[n.severity]} className="capitalize">
                        {n.severity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{n.description}</p>
                    <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">{relativeFromNow(n.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {n.actionRoute && (
                      <Button size="sm" variant="outline" onClick={() => navigate(n.actionRoute!)}>
                        {n.actionLabel ?? "View"}
                      </Button>
                    )}
                    {!n.read && (
                      <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                        Mark read
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </DataState>
    </div>
  );
}

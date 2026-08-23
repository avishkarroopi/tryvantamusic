import { useNavigate } from "react-router-dom";
import { BellOff, CheckCheck, Info, ShieldAlert, Sparkles, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { notifyAttentionChanged } from "@/hooks/useAttentionCounts";
import { notificationService } from "@/services";
import { relativeFromNow } from "@/lib/date";
import { cn } from "@/lib/cn";
import type { NotificationSeverity } from "@/domain/types";

const ICONS: Record<NotificationSeverity, typeof Info> = {
  info: Info,
  success: Sparkles,
  warning: TriangleAlert,
  critical: ShieldAlert,
};

const ICON_TONE: Record<NotificationSeverity, string> = {
  info: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning: "bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-300",
  critical: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const state = useAsync(() => notificationService.listNotifications(), []);

  async function handleMarkAll() {
    await notificationService.markAllRead();
    state.refetch();
    notifyAttentionChanged();
  }

  async function handleClick(id: string, route?: string) {
    await notificationService.markRead(id);
    state.refetch();
    notifyAttentionChanged();
    if (route) navigate(route);
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Everything that needs your attention, in one place."
        actions={
          <Button variant="outline" onClick={handleMarkAll}>
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        }
      />

      <Card>
        <DataState
          state={state}
          skeleton={<TableSkeleton rows={5} cols={2} />}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState icon={<BellOff className="size-6" />} title="You're all caught up" description="No notifications to show." />}
        >
          {(notifications) => (
            <CardBody className="space-y-2">
              {notifications.map((n) => {
                const Icon = ICONS[n.severity];
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n.id, n.actionRoute)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                      n.read
                        ? "border-ink-100 dark:border-ink-800"
                        : "border-brand-200 bg-brand-50/40 dark:border-brand-800/60 dark:bg-brand-500/5",
                    )}
                  >
                    <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", ICON_TONE[n.severity])}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink-900 dark:text-white">{n.title}</p>
                        {!n.read && <span className="size-2 shrink-0 rounded-full bg-brand-500" />}
                      </div>
                      <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{n.description}</p>
                      <p className="mt-1.5 text-xs text-ink-400 dark:text-ink-500">{relativeFromNow(n.createdAt)}</p>
                    </div>
                    {n.actionLabel && (
                      <span className="shrink-0 self-center text-sm font-semibold text-brand-600 dark:text-brand-400">
                        {n.actionLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </CardBody>
          )}
        </DataState>
      </Card>
    </div>
  );
}

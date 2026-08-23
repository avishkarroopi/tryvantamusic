import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/app-shell";
import { listNotifications, markNotificationRead } from "@/lib/notifications.functions";
import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";

const opts = queryOptions({
  queryKey: ["notifications"],
  queryFn: () => listNotifications(),
});

export const Route = createFileRoute("/_authenticated/notifications")({
  loader: ({ context }) => context.queryClient.ensureQueryData(opts),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data } = useSuspenseQuery(opts);
  const qc = useQueryClient();
  const readFn = useServerFn(markNotificationRead);
  const mut = useMutation({
    mutationFn: readFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <>
      <PageHeader title="Notifications" description="Every important signal from your growth engine." />
      <div className="p-6 md:p-8">
        {data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground" />
            <div className="mt-3 font-display font-semibold">You're all caught up</div>
            <div className="text-sm text-muted-foreground mt-1">Notifications appear here when leads come in or get qualified.</div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border shadow-elegant">
            {data.map((n) => (
              <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.read_at ? "bg-primary/5" : ""}`}>
                <div className={`mt-1 h-2 w-2 rounded-full ${!n.read_at ? "bg-primary" : "bg-muted"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
                  <div className="mt-2 flex gap-3 text-xs">
                    {n.lead_id && (
                      <Link to="/leads/$id" params={{ id: n.lead_id }} className="text-primary hover:underline">
                        View lead
                      </Link>
                    )}
                    {!n.read_at && (
                      <button className="text-muted-foreground hover:text-foreground"
                        onClick={() => mut.mutate({ data: { id: n.id } })}>
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

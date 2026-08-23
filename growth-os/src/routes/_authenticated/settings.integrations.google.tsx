import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getGoogleIntegrationStatus,
  getGoogleAuthorizeUrl,
  refreshGoogleDiscovery,
  disconnectGoogleIntegration,
} from "@/lib/google-integration.functions";
import { GOOGLE_SCOPES, GOOGLE_SCOPE_LABELS, RESOURCE_LABELS, type GoogleResourceType } from "@/lib/google-integration/scopes";
import type { ProductDiagnostic } from "@/lib/google-integration/discovery.server";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, ExternalLink, Loader2, Plug, RefreshCcw, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings/integrations/google")({
  component: GoogleIntegrationPage,
});

const RESOURCE_ORDER: GoogleResourceType[] = [
  "gbp_account",
  "gbp_location",
  "ga4_property",
  "gsc_site",
  "gmail_address",
  "ads_customer",
];

function GoogleIntegrationPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const statusFn = useServerFn(getGoogleIntegrationStatus);
  const authorizeFn = useServerFn(getGoogleAuthorizeUrl);
  const refreshFn = useServerFn(refreshGoogleDiscovery);
  const disconnectFn = useServerFn(disconnectGoogleIntegration);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["google-integration-status"],
    queryFn: () => statusFn(),
  });

  const [connecting, setConnecting] = useState(false);
  const [diagnostics, setDiagnostics] = useState<ProductDiagnostic[] | null>(null);

  const refreshMut = useMutation({
    mutationFn: () => refreshFn(),
    onSuccess: (res) => {
      const total = Object.values(res.perProduct ?? {}).reduce((a, b) => a + b, 0);
      setDiagnostics(res.diagnostics ?? null);
      toast.success(`Discovery complete — ${total} resource${total === 1 ? "" : "s"}`, {
        description: res.activatedAgents?.length
          ? `Activated: ${res.activatedAgents.join(", ")}`
          : "No agent state changed.",
      });
      qc.invalidateQueries({ queryKey: ["google-integration-status"] });
      router.invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Discovery failed"),
  });

  const disconnectMut = useMutation({
    mutationFn: () => disconnectFn(),
    onSuccess: () => {
      toast.success("Google account disconnected");
      qc.invalidateQueries({ queryKey: ["google-integration-status"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Disconnect failed"),
  });

  async function connect() {
    setConnecting(true);
    try {
      const res = await authorizeFn({ data: { origin: window.location.origin } });
      window.location.href = res.url;
    } catch (e) {
      setConnecting(false);
      toast.error(e instanceof Error ? e.message : "Could not start Google OAuth");
    }
  }

  const grouped: Record<string, Array<{ resource_id: string; display_name: string | null; metadata: Record<string, unknown> }>> = {};
  for (const r of data?.resources ?? []) {
    (grouped[r.resource_type] ??= []).push({ resource_id: r.resource_id, display_name: r.display_name, metadata: r.metadata });
  }

  return (
    <>
      <PageHeader
        title="Google Integration"
        description="Connect one Google account to power the Google Business, Analytics, Search Console, Gmail, and Ads agents."
      />
      <div className="p-6 md:p-8 max-w-4xl space-y-6">
        {isLoading ? (
          <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading integration status…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
            <div className="flex items-center gap-2 font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" /> {(error as Error).message}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              This page is admin-only. If you should have access, ask an admin to grant you the role.
            </p>
          </div>
        ) : !data?.clientIdPresent ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-6 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" /> Google OAuth client not configured
            </div>
            <p className="mt-2 text-muted-foreground">
              Set <code className="rounded bg-muted px-1 py-0.5 text-xs">GOOGLE_CLIENT_ID</code> and{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">GOOGLE_CLIENT_SECRET</code> in Secrets Manager first.
            </p>
          </div>
        ) : (
          <>
            {/* Connection card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display font-semibold text-lg">Connection</h3>
                  {data.connected && data.integration ? (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Signed in as <strong>{data.integration.google_email}</strong></span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Connected {new Date(data.integration.connected_at).toLocaleString()}.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-muted-foreground" /> Not connected
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {data.connected ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => refreshMut.mutate()} disabled={refreshMut.isPending}>
                        {refreshMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <RefreshCcw className="h-3.5 w-3.5 mr-2" />}
                        Refresh discovery
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Disconnect Google? Refresh token will be revoked and discovered resources removed.")) {
                            disconnectMut.mutate();
                          }
                        }}
                        disabled={disconnectMut.isPending}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={connect} disabled={connecting}>
                      {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Plug className="h-3.5 w-3.5 mr-2" />}
                      Connect Google
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Requested access</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {GOOGLE_SCOPES.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {GOOGLE_SCOPE_LABELS[s] ?? s}
                    </Badge>
                  ))}
                </div>
              </div>

              {!data.connected && (
                <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground space-y-2">
                  <p className="font-medium text-foreground">Before your first connect</p>
                  <p>
                    Add this exact URI to your Google Cloud OAuth client's <em>Authorized redirect URIs</em>:
                  </p>
                  <code className="block rounded bg-muted px-3 py-2 font-mono">
                    {typeof window !== "undefined" ? `${window.location.origin}/api/public/google/oauth/callback` : "/api/public/google/oauth/callback"}
                  </code>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Open Google Cloud Console <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Discovered resources */}
            {data.connected && (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-lg">Discovered resources</h3>
                  <span className="text-xs text-muted-foreground">
                    {(data.resources ?? []).length} total
                  </span>
                </div>
                <div className="mt-4 space-y-4">
                  {RESOURCE_ORDER.map((type) => {
                    const items = grouped[type] ?? [];
                    const disabledAds = type === "ads_customer" && !data.adsDeveloperTokenPresent;
                    return (
                      <div key={type} className="rounded-lg border border-border/60 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{RESOURCE_LABELS[type]}</p>
                            {disabledAds && (
                              <p className="text-xs text-muted-foreground">
                                Skipped — set <code className="rounded bg-muted px-1">GOOGLE_ADS_DEVELOPER_TOKEN</code> to enable.
                              </p>
                            )}
                          </div>
                          <Badge variant={items.length > 0 ? "default" : "secondary"}>
                            {items.length}
                          </Badge>
                        </div>
                        {items.length > 0 && (
                          <ul className="mt-3 space-y-1.5 text-xs">
                            {items.map((it) => (
                              <li key={it.resource_id} className="flex items-center justify-between gap-3 rounded bg-muted/40 px-3 py-2">
                                <span className="truncate">
                                  <span className="font-medium">{it.display_name ?? it.resource_id}</span>
                                  {it.display_name && it.display_name !== it.resource_id && (
                                    <span className="text-muted-foreground"> · {it.resource_id}</span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Discovery runs automatically after connect. Rerun any time — it re-syncs all IDs and reactivates matching agents.
                </p>
              </div>
            )}

            {data.connected && (
              <DiagnosticsPanel
                diagnostics={diagnostics}
                onRun={() => refreshMut.mutate()}
                running={refreshMut.isPending}
              />
            )}

            <div className="rounded-xl border border-border bg-card p-6 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm">Reusability</p>
              <p className="mt-1">
                This module lives under <code className="rounded bg-muted px-1">src/lib/google-integration/</code>. Copy the folder plus the two route files
                and the two database tables into another OS project to reuse it — only the OAuth client redirect URIs change.
              </p>
            </div>
          </>
        )}

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="h-3.5 w-3.5 mr-2" /> Reload
          </Button>
        </div>
      </div>
    </>
  );
}

function DiagnosticsPanel({
  diagnostics,
  onRun,
  running,
}: {
  diagnostics: ProductDiagnostic[] | null;
  onRun: () => void;
  running: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-semibold text-lg">Discovery diagnostics</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Per-product HTTP status, response preview, and exact reason when no resources are returned.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onRun} disabled={running}>
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <RefreshCcw className="h-3.5 w-3.5 mr-2" />}
          Run diagnostics
        </Button>
      </div>
      {!diagnostics ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Click <em>Run diagnostics</em> to inspect each Google product call.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {diagnostics.map((d) => (
            <DiagnosticRow key={d.product} d={d} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DiagnosticRow({ d }: { d: ProductDiagnostic }) {
  const [open, setOpen] = useState(false);
  const okAll = d.steps.every((s) => s.ok);
  const status = d.count > 0 ? "ok" : okAll ? "empty" : "error";
  const dot =
    status === "ok"
      ? "bg-emerald-500"
      : status === "empty"
        ? "bg-amber-500"
        : "bg-destructive";
  return (
    <li className="rounded-lg border border-border/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          <span className="font-medium text-sm">{d.label}</span>
          <Badge variant="secondary" className="text-xs">{d.count} found</Badge>
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {d.reason ? <span className="truncate max-w-[280px]">{d.reason}</span> : null}
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
      </button>
      {open && (
        <div className="border-t border-border/60 px-4 py-3 space-y-3 text-xs">
          {d.reason && (
            <div className="rounded bg-muted/60 px-3 py-2">
              <span className="font-medium">Reason:</span> {d.reason}
            </div>
          )}
          {d.steps.map((s, i) => (
            <div key={i} className="rounded border border-border/60 p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{s.label}</span>
                <span className="flex items-center gap-2">
                  <Badge variant={s.ok ? "default" : "destructive"} className="text-[10px]">
                    {s.status === null ? "SKIPPED" : `HTTP ${s.status}`}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">count {s.count}</Badge>
                </span>
              </div>
              <div className="text-muted-foreground font-mono break-all">{s.url}</div>
              {s.note && <div className="text-amber-600 dark:text-amber-400">{s.note}</div>}
              {s.bodyPreview && (
                <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted/60 p-2 text-[11px] font-mono whitespace-pre-wrap break-all">
                  {s.bodyPreview}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

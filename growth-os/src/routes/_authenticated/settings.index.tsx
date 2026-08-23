import { createFileRoute, Link } from "@tanstack/react-router";
import { useRouteContext } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Info, Puzzle, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: SettingsIndexPage,
});

function SettingsIndexPage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  return (
    <>
      <PageHeader title="Settings" description="Workspace, team & integration setup." />
      <div className="p-6 md:p-8 max-w-3xl space-y-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold">Your account</h3>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Team roles</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The first user to sign up is automatically granted <strong>admin</strong>.
                Additional users start as viewers — an admin can promote them to <strong>sales</strong> or <strong>marketing</strong> from the backend for now. Team-management UI ships next.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Puzzle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold">Integrations</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect the platforms that power your agents. Google Business Profile, Analytics, Search Console, Gmail, and Ads are available now.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link to="/settings/integrations/google">
                    Connect Google
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold">Public capture endpoint</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Send POST requests with lead payloads to:
          </p>
          <code className="mt-2 block rounded-md bg-muted px-3 py-2 text-xs font-mono">
            POST /api/public/leads/capture
          </code>
          <p className="mt-2 text-xs text-muted-foreground">
            Accepts name, email, phone, country, instrument, and full UTM params. Adapters for Meta, Google, and WhatsApp plug in here.
          </p>
        </div>
      </div>
    </>
  );
}

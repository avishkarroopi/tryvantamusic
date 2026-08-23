import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Target, RefreshCcw, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-gradient" />
            <span className="font-display text-lg font-bold tracking-tight">
              Muziclly <span className="text-muted-foreground font-medium">Growth OS</span>
            </span>
          </div>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Sign in <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6">
        <section className="py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Phase 1 · Lead Acquisition & Conversion
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Intelligent lead acquisition
              <br />
              & conversion engine.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Capture every lead. Qualify with AI. Recover the dormant.
              Purpose-built for premium music education.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Open the OS <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Team login
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-24 md:grid-cols-3">
          {[
            {
              icon: Target,
              title: "Lead Capture Agent",
              body: "Multi-source ingestion with full UTM attribution. Website, Meta, Google, WhatsApp — one pipeline.",
            },
            {
              icon: Sparkles,
              title: "AI Qualification Agent",
              body: "0–100 scoring across 7 dimensions. Auto-labels, AI summary, next-best action.",
            },
            {
              icon: RefreshCcw,
              title: "Re-Engagement Agent",
              body: "Recover dormant leads at 30, 60, 90, 180, and 365-day thresholds.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 shadow-elegant"
            >
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <f.icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>© Muziclly · Growth OS</span>
          <span className="inline-flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Phase 1
          </span>
        </div>
      </footer>
    </div>
  );
}

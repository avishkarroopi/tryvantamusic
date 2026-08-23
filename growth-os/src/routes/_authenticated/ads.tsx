import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ads")({
  component: AdsLayout,
});

function AdsLayout() {
  const loc = useLocation();
  const tabs = [
    { to: "/ads/meta", label: "Meta (V8)" },
    { to: "/ads/google", label: "Google (V9)" },
  ];
  return (
    <>
      <PageHeader
        eyebrow="V8 & V9 · Ads Intelligence"
        title="Ads Intelligence"
        description="Analyze campaigns and surface human-approved recommendations. Never spends budget automatically."
      />
      <div className="px-6 md:px-8 pt-4 border-b border-border">
        <div className="flex gap-1">
          {tabs.map((t) => {
            const active = loc.pathname.startsWith(t.to);
            return (
              <Link key={t.to} to={t.to} className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px",
                active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}>{t.label}</Link>
            );
          })}
        </div>
      </div>
      <div className="p-6 md:p-8">
        <Outlet />
      </div>
    </>
  );
}

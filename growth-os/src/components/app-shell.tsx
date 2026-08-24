import { Link, useLocation, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  RefreshCcw,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  IndianRupee,
  Star,
  Rocket,
  MessageSquare,
  Compass,
  MapPin,
  Bot,
  BookOpen,
  Radar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/command", label: "Command", icon: Compass },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/copilot", label: "Copilot", icon: Sparkles },
  { to: "/intelligence", label: "Marketing", icon: TrendingUp },
  { to: "/revenue", label: "Revenue", icon: IndianRupee },
  { to: "/ads", label: "Ads", icon: Rocket },
  { to: "/content", label: "Content", icon: MessageSquare },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/gbp", label: "Google Business", icon: MapPin },
  { to: "/competitive-intelligence", label: "Competitive Intel", icon: Radar },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/knowledge", label: "Knowledge", icon: BookOpen },
  { to: "/reengagement", label: "Re-engagement", icon: RefreshCcw },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useRouteContext({ from: "/_authenticated" });

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const isActive = (to: string) =>
    to === "/dashboard" ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
          <div className="h-7 w-7 rounded-md bg-brand-gradient" />
          <div className="leading-tight">
            <div className="font-display text-sm font-bold">Music</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Growth OS
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.to)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="h-8 w-8 rounded-full bg-brand-gradient flex items-center justify-center text-xs font-bold text-primary-foreground">
              {(user.email ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate">{user.email}</div>
              <div className="text-[10px] text-muted-foreground">Team member</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed inset-x-0 top-0 z-40 h-14 flex items-center justify-between px-4 border-b border-border bg-background/90 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-brand-gradient" />
          <span className="font-display font-bold text-sm">Music OS</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen((v) => !v)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-30 bg-background border-t border-border p-4 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium",
                isActive(item.to)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <Button variant="outline" className="w-full mt-4" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="border-b border-border">
      <div className="px-6 md:px-8 py-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              <Sparkles className="h-3 w-3 text-primary" /> {eyebrow}
            </div>
          )}
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

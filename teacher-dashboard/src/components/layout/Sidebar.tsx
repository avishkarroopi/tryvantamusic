import { NavLink } from "react-router-dom";
import { ChevronsLeft, Music2, X } from "lucide-react";
import { NAV_SECTIONS } from "@/app/nav";
import { useSidebar } from "@/app/SidebarProvider";
import { useAttentionCounts } from "@/hooks/useAttentionCounts";
import { cn } from "@/lib/cn";

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
        <Music2 className="size-5" />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <p className="font-display text-[15px] font-extrabold tracking-tight text-ink-900 dark:text-white">Muziclly</p>
          <p className="text-[11px] font-medium text-ink-400 dark:text-ink-500">Teachers Dashboard</p>
        </div>
      )}
    </div>
  );
}

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const counts = useAttentionCounts();
  const badgeFor = (key?: "notifications" | "messages" | "opportunities") =>
    key ? counts[key] : 0;

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-2">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          {!collapsed && (
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-ink-600">
              {section.label}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const badge = badgeFor(item.badgeKey);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/dashboard"}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                        : "text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100",
                      collapsed && "justify-center px-0",
                    )
                  }
                >
                  <item.icon className="size-[18px] shrink-0" />
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                  {!collapsed && badge > 0 && (
                    <span className="rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                  {collapsed && badge > 0 && (
                    <span className="absolute ml-6 mt-[-14px] size-2 rounded-full bg-accent-500" />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function DesktopSidebar() {
  const { collapsed, toggleCollapsed } = useSidebar();
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-ink-100 bg-white transition-[width] duration-200 dark:border-ink-800 dark:bg-ink-900 lg:flex",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-ink-100 px-4 dark:border-ink-800">
        <Brand collapsed={collapsed} />
      </div>
      <SidebarContent collapsed={collapsed} />
      <div className="border-t border-ink-100 p-3 dark:border-ink-800">
        <button
          onClick={toggleCollapsed}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronsLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  const { mobileOpen, setMobileOpen } = useSidebar();
  if (!mobileOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      <div className="animate-fade-in absolute inset-0 bg-ink-950/50" onClick={() => setMobileOpen(false)} aria-hidden />
      <div className="relative flex h-full w-72 flex-col bg-white shadow-pop dark:bg-ink-900">
        <div className="flex h-16 items-center justify-between border-b border-ink-100 px-4 dark:border-ink-800">
          <Brand collapsed={false} />
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
          >
            <X className="size-5" />
          </button>
        </div>
        <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
      </div>
    </div>
  );
}

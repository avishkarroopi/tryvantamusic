import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Menu, Moon, Sun, User } from "lucide-react";
import { useSidebar } from "@/app/SidebarProvider";
import { useTheme } from "@/app/ThemeProvider";
import { useAttentionCounts } from "@/hooks/useAttentionCounts";
import { Avatar } from "@/components/ui/Avatar";
import { student } from "@/mocks/seed";

export function Topbar() {
  const { setMobileOpen } = useSidebar();
  const { theme, toggle } = useTheme();
  const counts = useAttentionCounts();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-ink-100 bg-white/80 px-4 backdrop-blur dark:border-ink-800 dark:bg-ink-900/80 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800 lg:hidden"
        >
          <Menu className="size-5" />
        </button>
        <div className="hidden sm:block">
          <p className="text-xs font-medium text-ink-400 dark:text-ink-500">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p className="font-display text-sm font-bold text-ink-900 dark:text-white">
            Welcome back, {student.name.split(" ")[0]}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
        >
          {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </button>
        <button
          onClick={() => navigate("/dashboard/notifications")}
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
        >
          <Bell className="size-[18px]" />
          {counts.notifications > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-accent-500 ring-2 ring-white dark:ring-ink-900" />
          )}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-ink-100 dark:hover:bg-ink-800"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Avatar name={student.name} size="sm" />
            <span className="hidden text-left text-sm leading-tight sm:block">
              <span className="block font-semibold text-ink-900 dark:text-white">{student.name}</span>
              <span className="block text-xs text-ink-400 dark:text-ink-500">Student</span>
            </span>
            <ChevronDown className="hidden size-4 text-ink-400 sm:block" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="animate-fade-in absolute right-0 mt-2 w-48 rounded-xl border border-ink-100 bg-white p-1.5 shadow-pop dark:border-ink-800 dark:bg-ink-900"
            >
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/dashboard/profile");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
              >
                <User className="size-4" /> Profile
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/login");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <LogOut className="size-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

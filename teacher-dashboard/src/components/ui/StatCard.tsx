import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  tone = "brand",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; direction: "up" | "down" };
  tone?: "brand" | "accent" | "success" | "neutral";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300",
    accent: "bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-300",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    neutral: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
  };

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-start justify-between">
        <div className={cn("flex size-10 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="size-5" />
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              trend.direction === "up" ? "text-emerald-600" : "text-rose-500",
            )}
          >
            {trend.direction === "up" ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {trend.value}
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-2xl font-bold text-ink-900 dark:text-white">{value}</p>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{label}</p>
    </div>
  );
}

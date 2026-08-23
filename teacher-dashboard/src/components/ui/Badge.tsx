import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "brand" | "success" | "warning" | "danger" | "neutral" | "info";

const TONES: Record<BadgeTone, string> = {
  brand: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning: "bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300",
  danger: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  neutral: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
  info: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

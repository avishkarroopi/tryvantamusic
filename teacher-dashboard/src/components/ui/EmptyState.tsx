import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-14 text-center", className)}>
      <div className="flex size-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500">
        {icon ?? <Inbox className="size-6" />}
      </div>
      <div className="max-w-sm space-y-1">
        <p className="font-display text-sm font-semibold text-ink-800 dark:text-ink-100">{title}</p>
        {description && <p className="text-sm text-ink-500 dark:text-ink-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

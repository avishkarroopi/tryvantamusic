import { Music2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-12 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
          <Music2 className="size-6" />
        </div>
        <p className="text-sm font-medium text-ink-400 dark:text-ink-500">Loading…</p>
      </div>
    </div>
  );
}

import { RefreshCcw, TriangleAlert } from "lucide-react";
import { Button } from "./Button";

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10">
        <TriangleAlert className="size-6" />
      </div>
      <div className="max-w-sm space-y-1">
        <p className="font-display text-sm font-semibold text-ink-800 dark:text-ink-100">Something went wrong</p>
        <p className="text-sm text-ink-500 dark:text-ink-400">
          {message ?? "We couldn't load this data. Please try again."}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCcw className="size-4" />
          Retry
        </Button>
      )}
    </div>
  );
}

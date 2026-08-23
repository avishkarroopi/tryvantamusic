import { Link } from "react-router-dom";
import { Music2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-50 px-6 text-center dark:bg-ink-950">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-600 text-white">
        <Music2 className="size-8" />
      </div>
      <h1 className="font-display text-3xl font-bold text-ink-900 dark:text-white">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-500 dark:text-ink-400">
        The page you're looking for doesn't exist in the Muziclly Teachers Dashboard.
      </p>
      <Button onClick={() => window.history.back()} variant="outline">
        Go back
      </Button>
      <Link to="/dashboard" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
        Return to Dashboard
      </Link>
    </div>
  );
}

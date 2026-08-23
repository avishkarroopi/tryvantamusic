import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Music2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { student } from "@/mocks/seed";

/**
 * Standalone mock login screen (same seam as the Teacher Dashboard's). Not
 * wired to a real identity provider — in production this app is reached via
 * the main Muziclly site's Firebase-authenticated `/student` bridge page,
 * which is the real auth gate; this screen exists for direct/dev access to
 * this sub-app and as the seam where a token-based handoff plugs in later.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(student.email);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate("/dashboard"), 500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 dark:bg-ink-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
            <Music2 className="size-6" />
          </div>
          <div>
            <p className="font-display text-lg font-extrabold text-ink-900 dark:text-white">Muziclly</p>
            <p className="text-xs font-medium text-ink-400 dark:text-ink-500">Student Dashboard</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900"
        >
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink-700 dark:text-ink-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-ink-700 dark:bg-ink-950 dark:text-white dark:focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink-700 dark:text-ink-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              defaultValue="••••••••"
              required
              className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-ink-700 dark:bg-ink-950 dark:text-white dark:focus:ring-brand-500/20"
            />
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
          <p className="text-center text-xs text-ink-400 dark:text-ink-500">
            This is a demo sign-in backed by local mock data — no credentials are transmitted anywhere.
          </p>
        </form>
      </div>
    </div>
  );
}

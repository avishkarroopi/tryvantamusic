import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { makeId } from "@/lib/id";

export type ToastKind = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastContextValue {
  push: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: TriangleAlert,
};

const ACCENTS: Record<ToastKind, string> = {
  success: "border-l-emerald-500 [&_svg]:text-emerald-500",
  error: "border-l-rose-500 [&_svg]:text-rose-500",
  info: "border-l-brand-500 [&_svg]:text-brand-500",
  warning: "border-l-accent-500 [&_svg]:text-accent-500",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = makeId("toast");
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              className={`animate-fade-in pointer-events-auto flex items-start gap-3 rounded-xl border-l-4 bg-white p-3.5 shadow-pop ring-1 ring-ink-900/5 dark:bg-ink-800 dark:ring-white/10 ${ACCENTS[t.kind]}`}
            >
              <Icon className="mt-0.5 size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-300">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-700"
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

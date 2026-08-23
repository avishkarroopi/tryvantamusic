import type { ReactNode } from "react";
import { useEffect } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="animate-fade-in absolute inset-0 bg-ink-950/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-pop dark:bg-ink-900 sm:max-w-lg"
        style={{ animation: "fade-in 0.2s ease-out" }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 p-5 dark:border-ink-800">
          <div>
            <h2 id="drawer-title" className="font-display text-lg font-bold text-ink-900 dark:text-white">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-100"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-ink-100 p-4 dark:border-ink-800">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

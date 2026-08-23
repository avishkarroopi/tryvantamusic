import { cn } from "@/lib/cn";

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number }[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="tablist" className="flex w-full gap-1 overflow-x-auto rounded-xl bg-ink-100 p-1 dark:bg-ink-800">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={active === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
            active === tab.value
              ? "bg-white text-ink-900 shadow-sm dark:bg-ink-950 dark:text-white"
              : "text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100",
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                active === tab.value ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300" : "bg-ink-200 text-ink-600 dark:bg-ink-700 dark:text-ink-300",
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";

const PALETTE = [
  "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300",
  "bg-accent-100 text-accent-700 dark:bg-accent-500/20 dark:text-accent-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
];

function paletteFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % PALETTE.length;
  return PALETTE[hash];
}

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const sizes = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg", xl: "size-24 text-2xl" };
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        paletteFor(name),
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}

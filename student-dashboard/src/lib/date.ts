import {
  addDays,
  format,
  formatDistanceToNow,
  isSameDay,
  isToday,
  isTomorrow,
  parseISO,
} from "date-fns";

export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Full timestamp (date + time) for records created "just now" — e.g. a sent chat message. */
export function nowISO(): string {
  return new Date().toISOString();
}

export function addDaysISO(base: Date, days: number): string {
  return toISODate(addDays(base, days));
}

export function formatFriendlyDate(iso: string): string {
  const date = parseISO(iso);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, d MMM");
}

export function formatFullDate(iso: string): string {
  return format(parseISO(iso), "d MMMM yyyy");
}

export function formatTimeRange(start: string, end: string): string {
  return `${to12h(start)} – ${to12h(end)}`;
}

export function to12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function relativeFromNow(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true });
}

export function isSameISODay(iso: string, date: Date): boolean {
  return isSameDay(parseISO(iso), date);
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function monthMatrix(year: number, monthIndex: number): (Date | null)[][] {
  const first = new Date(year, monthIndex, 1);
  const startOffset = (first.getDay() + 6) % 7; // convert Sun=0 -> Mon=0 start
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, monthIndex, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

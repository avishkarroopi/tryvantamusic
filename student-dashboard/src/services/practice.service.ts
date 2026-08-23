import type { Instrument, PracticeLog } from "@/domain/types";
import { practiceLogs as mockLogs } from "@/mocks/seed";
import { todayISO } from "@/lib/date";
import { makeId } from "@/lib/id";
import { clone, withDelay } from "./async";

export interface PracticeService {
  listLogs(): Promise<PracticeLog[]>;
  logPractice(minutes: number, instrument: Instrument, note?: string): Promise<PracticeLog>;
  currentStreakDays(): Promise<number>;
}

const store: PracticeLog[] = clone(mockLogs);

export const practiceService: PracticeService = {
  async listLogs() {
    return withDelay(clone(store).sort((a, b) => b.date.localeCompare(a.date)));
  },
  async logPractice(minutes, instrument, note) {
    const entry: PracticeLog = { id: makeId("prac"), date: todayISO(), minutes, instrument, note };
    const existingToday = store.find((l) => l.date === todayISO() && l.instrument === instrument);
    if (existingToday) {
      existingToday.minutes += minutes;
      if (note) existingToday.note = note;
      await withDelay(null, 150);
      return clone(existingToday);
    }
    store.unshift(entry);
    await withDelay(null, 150);
    return clone(entry);
  },
  async currentStreakDays() {
    const sorted = [...store].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    const cursor = new Date();
    for (const log of sorted) {
      const iso = cursor.toISOString().slice(0, 10);
      if (log.date === iso && log.minutes > 0) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else if (log.date === iso) {
        break;
      }
    }
    return withDelay(streak, 150);
  },
};

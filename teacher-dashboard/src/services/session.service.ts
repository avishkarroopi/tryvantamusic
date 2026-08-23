import type { Session } from "@/domain/types";
import { sessions as mockSessions } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface SessionService {
  listSessions(range?: { startDate: string; endDate: string }): Promise<Session[]>;
  cancelSession(id: string): Promise<Session>;
}

const store: Session[] = clone(mockSessions);

export const sessionService: SessionService = {
  async listSessions(range) {
    let list = store;
    if (range) {
      list = store.filter((s) => s.sessionDate >= range.startDate && s.sessionDate <= range.endDate);
    }
    return withDelay(clone(list).sort((a, b) => (a.sessionDate + a.startTime).localeCompare(b.sessionDate + b.startTime)));
  },
  async cancelSession(id) {
    const target = store.find((s) => s.id === id);
    if (!target) throw new Error("Session not found");
    target.status = "cancelled";
    return withDelay(clone(target));
  },
};

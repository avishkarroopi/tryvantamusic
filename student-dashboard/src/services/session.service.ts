import type { Session } from "@/domain/types";
import { sessions as mockSessions } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface SessionService {
  listSessions(range?: { startDate: string; endDate: string }): Promise<Session[]>;
}

const store: Session[] = clone(mockSessions);

export const sessionService: SessionService = {
  async listSessions(range) {
    let result = clone(store);
    if (range) {
      result = result.filter((s) => s.sessionDate >= range.startDate && s.sessionDate <= range.endDate);
    }
    return withDelay(result.sort((a, b) => a.sessionDate.localeCompare(b.sessionDate)));
  },
};

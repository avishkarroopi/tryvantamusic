import type { Leave } from "@/domain/types";
import { leaves as mockLeaves } from "@/mocks/seed";
import { makeId } from "@/lib/id";
import { todayISO } from "@/lib/date";
import { clone, withDelay } from "./async";

export interface LeaveService {
  listLeaves(): Promise<Leave[]>;
  applyLeave(input: { fromDate: string; toDate: string; reason: string }): Promise<Leave>;
  cancelLeave(id: string): Promise<Leave>;
}

let store: Leave[] = clone(mockLeaves);

export const leaveService: LeaveService = {
  async listLeaves() {
    return withDelay(clone(store).sort((a, b) => b.appliedOn.localeCompare(a.appliedOn)));
  },
  async applyLeave(input) {
    const created: Leave = {
      id: makeId("lv"),
      ...input,
      status: "pending",
      appliedOn: todayISO(),
    };
    store = [created, ...store];
    return withDelay(clone(created));
  },
  async cancelLeave(id) {
    const target = store.find((l) => l.id === id);
    if (!target) throw new Error("Leave not found");
    target.status = "cancelled";
    return withDelay(clone(target));
  },
};

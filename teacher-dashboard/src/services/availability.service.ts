import type { AvailabilitySlot } from "@/domain/types";
import { availability as mockAvailability } from "@/mocks/seed";
import { makeId } from "@/lib/id";
import { clone, withDelay } from "./async";

export interface AvailabilityService {
  listSlots(): Promise<AvailabilitySlot[]>;
  addSlot(slot: Omit<AvailabilitySlot, "id">): Promise<AvailabilitySlot>;
  removeSlot(id: string): Promise<void>;
}

let store: AvailabilitySlot[] = clone(mockAvailability);

export const availabilityService: AvailabilityService = {
  async listSlots() {
    return withDelay(clone(store));
  },
  async addSlot(slot) {
    const created: AvailabilitySlot = { ...slot, id: makeId("av") };
    store = [...store, created];
    return withDelay(clone(created));
  },
  async removeSlot(id) {
    store = store.filter((s) => s.id !== id);
    await withDelay(null, 200);
  },
};

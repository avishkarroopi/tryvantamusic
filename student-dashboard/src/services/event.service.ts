import type { MasterclassEvent, OpenMicEvent } from "@/domain/types";
import { masterclasses as mockMasterclasses, openMics as mockOpenMics } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface EventService {
  listMasterclasses(): Promise<MasterclassEvent[]>;
  registerMasterclass(id: string): Promise<void>;
  listOpenMics(): Promise<OpenMicEvent[]>;
  registerOpenMic(id: string): Promise<void>;
}

const masterclassStore: MasterclassEvent[] = clone(mockMasterclasses);
const openMicStore: OpenMicEvent[] = clone(mockOpenMics);

export const eventService: EventService = {
  async listMasterclasses() {
    return withDelay(clone(masterclassStore));
  },
  async registerMasterclass(id) {
    const event = masterclassStore.find((e) => e.id === id);
    if (event && !event.isRegistered) {
      event.isRegistered = true;
      event.seatsFilled += 1;
    }
    await withDelay(null, 180);
  },
  async listOpenMics() {
    return withDelay(clone(openMicStore));
  },
  async registerOpenMic(id) {
    const event = openMicStore.find((e) => e.id === id);
    if (event && !event.isRegistered) {
      event.isRegistered = true;
      event.slotsFilled += 1;
    }
    await withDelay(null, 180);
  },
};

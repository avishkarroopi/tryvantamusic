import type { MasterclassEvent, OpenMicEvent } from "@/domain/types";
import { masterclasses as mockMasterclasses, openMicEvents as mockOpenMic } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface EventService {
  listMasterclasses(): Promise<MasterclassEvent[]>;
  listOpenMicEvents(): Promise<OpenMicEvent[]>;
  toggleMasterclassRegistration(id: string): Promise<MasterclassEvent>;
  toggleOpenMicRegistration(id: string): Promise<OpenMicEvent>;
}

const masterclassStore: MasterclassEvent[] = clone(mockMasterclasses);
const openMicStore: OpenMicEvent[] = clone(mockOpenMic);

export const eventService: EventService = {
  async listMasterclasses() {
    return withDelay(clone(masterclassStore));
  },
  async listOpenMicEvents() {
    return withDelay(clone(openMicStore));
  },
  async toggleMasterclassRegistration(id) {
    const target = masterclassStore.find((m) => m.id === id);
    if (!target) throw new Error("Masterclass not found");
    target.isRegistered = !target.isRegistered;
    target.seatsFilled += target.isRegistered ? 1 : -1;
    return withDelay(clone(target), 250);
  },
  async toggleOpenMicRegistration(id) {
    const target = openMicStore.find((m) => m.id === id);
    if (!target) throw new Error("Open mic event not found");
    target.isRegistered = !target.isRegistered;
    target.slotsFilled += target.isRegistered ? 1 : -1;
    return withDelay(clone(target), 250);
  },
};

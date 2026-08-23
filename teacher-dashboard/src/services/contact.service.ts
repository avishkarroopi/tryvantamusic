import type { MeetingRequest, StaffContact } from "@/domain/types";
import { meetingRequests as mockMeetingRequests, staffContacts as mockContacts } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface ContactService {
  listContacts(): Promise<StaffContact[]>;
  listMeetingRequests(): Promise<MeetingRequest[]>;
  respondToMeetingRequest(id: string, accept: boolean): Promise<MeetingRequest>;
}

const contactStore: StaffContact[] = clone(mockContacts);
const meetingStore: MeetingRequest[] = clone(mockMeetingRequests);

export const contactService: ContactService = {
  async listContacts() {
    return withDelay(clone(contactStore));
  },
  async listMeetingRequests() {
    return withDelay(clone(meetingStore));
  },
  async respondToMeetingRequest(id, accept) {
    const target = meetingStore.find((m) => m.id === id);
    if (!target) throw new Error("Meeting request not found");
    target.status = accept ? "accepted" : "rejected";
    return withDelay(clone(target));
  },
};

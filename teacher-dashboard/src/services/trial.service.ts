import type { Session, TrialOpportunity } from "@/domain/types";
import { sessions as mockSessions, trialOpportunities as mockOpportunities } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface TrialService {
  listTrialSessions(): Promise<Session[]>;
  listOpportunities(): Promise<TrialOpportunity[]>;
  claimOpportunity(id: string): Promise<Session>;
  declineOpportunity(id: string): Promise<void>;
}

const sessionStore: Session[] = clone(mockSessions);
let opportunityStore: TrialOpportunity[] = clone(mockOpportunities);

export const trialService: TrialService = {
  async listTrialSessions() {
    return withDelay(clone(sessionStore.filter((s) => s.recordType === "trial")));
  },
  async listOpportunities() {
    return withDelay(clone(opportunityStore));
  },
  async claimOpportunity(id) {
    const opp = opportunityStore.find((o) => o.id === id);
    if (!opp) throw new Error("Opportunity no longer available");
    opportunityStore = opportunityStore.filter((o) => o.id !== id);
    const [h, m] = opp.startTime.split(":").map(Number);
    const endMinutes = h * 60 + m + 30;
    const newSession: Session = {
      id: `ses_${opp.id}`,
      recordType: "trial",
      batchName: `${opp.courseTitle} (Trial)`,
      studentId: `stu_opp_${opp.id}`,
      studentName: opp.studentName,
      instrument: opp.instrument,
      region: opp.region,
      sessionDate: opp.sessionDate,
      startTime: opp.startTime,
      endTime: `${Math.floor(endMinutes / 60)
        .toString()
        .padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`,
      durationMinutes: 30,
      status: "scheduled",
      sessionNum: 0,
      hasAiNotes: false,
      meetingRoomId: "muz-room-482",
    };
    sessionStore.push(newSession);
    return withDelay(clone(newSession));
  },
  async declineOpportunity(id) {
    opportunityStore = opportunityStore.filter((o) => o.id !== id);
    await withDelay(null, 200);
  },
};

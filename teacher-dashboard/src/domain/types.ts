/**
 * Domain models for the Muziclly Teachers Dashboard.
 *
 * These types describe our own data model. They are informed by the field
 * shapes documented in Reference/SPARDHA_FORENSIC_ANALYSIS.md but are an
 * independent design — field names, groupings and enums have been rethought
 * for clarity and are not a copy of any third-party schema.
 */

export type ID = string;

export type Instrument =
  | "piano"
  | "guitar"
  | "vocals"
  | "violin"
  | "drums"
  | "ukulele"
  | "flute"
  | "tabla";

export type SessionStatus = "scheduled" | "completed" | "cancelled" | "no-show";
export type BatchStatus = "active" | "inactive" | "paused" | "completed";
export type TrialOutcome = "pending" | "won" | "lost";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type ReviewSentiment = "positive" | "neutral" | "negative";
export type NotificationSeverity = "info" | "warning" | "critical" | "success";
export type MeetingRequestStatus = "pending" | "accepted" | "completed" | "rejected";

export interface Teacher {
  id: ID;
  name: string;
  email: string;
  phone: string;
  emergencyPhone?: string;
  gender: "M" | "F" | "Other";
  role: "teacher";
  photoUrl?: string;
  dob?: string;
  joinedDate: string;
  city: string;
  state: string;
  country: string;
  addressLine1?: string;
  pincode?: string;
  languages: string[];
  categories: Instrument[];
  introduction: string;
  isKidFriendly: boolean;
  isTrialEligible: boolean;
  batchLimit: number;
  status: "active" | "onboarding" | "inactive";
  meetingRoomId: string;
}

export interface StaffContact {
  id: ID;
  kind: "SME" | "TSM" | "Admin";
  name: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  role: string;
}

export interface Student {
  id: ID;
  name: string;
  ageGroup: string;
  gender: "Male" | "Female" | "Other";
  guardianName?: string;
  guardianPhone?: string;
  city?: string;
  region: string;
  instrument: Instrument;
  batchId?: ID;
  joinedDate: string;
  notes?: string;
  totalHoursCompleted: number;
  status: "trial" | "active" | "paused" | "churned";
}

export interface Batch {
  id: ID;
  name: string;
  instrument: Instrument;
  status: BatchStatus;
  studentIds: ID[];
  schedule: { day: string; startTime: string; endTime: string }[];
  startedOn: string;
  totalSessionsDelivered: number;
  totalHoursDelivered: number;
  nextSessionAt?: string;
}

export interface Session {
  id: ID;
  recordType: "trial" | "regular";
  batchId?: ID;
  batchName: string;
  studentId: ID;
  studentName: string;
  instrument: Instrument;
  region: string;
  sessionDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;
  durationMinutes: number;
  status: SessionStatus;
  sessionNum: number;
  notes?: string;
  hasAiNotes: boolean;
  meetingRoomId: string;
}

export interface TrialOpportunity {
  id: ID;
  studentName: string;
  ageGroup: string;
  studentGender: "Male" | "Female" | "Other";
  courseTitle: string;
  instrument: Instrument;
  region: string;
  sessionDate: string;
  startTime: string;
  postedAt: string;
  expiresAt: string;
}

export interface TrialSession extends Session {
  recordType: "trial";
  outcome: TrialOutcome;
  parentGoals?: string;
}

export interface AvailabilitySlot {
  id: ID;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  startTime: string;
  endTime: string;
  isTrialSlot: boolean;
}

export interface Leave {
  id: ID;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  respondedOn?: string;
  approverNote?: string;
}

export interface Review {
  id: ID;
  studentName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  sentiment: ReviewSentiment;
  createdAt: string;
  batchName?: string;
}

export interface MeetingRequest {
  id: ID;
  withName: string;
  withRole: string;
  requestedAt: string;
  proposedDate: string;
  status: MeetingRequestStatus;
  reason: string;
}

export interface NotificationItem {
  id: ID;
  title: string;
  description: string;
  severity: NotificationSeverity;
  createdAt: string;
  read: boolean;
  actionLabel?: string;
  actionRoute?: string;
  category: "trial" | "meeting" | "message" | "leave" | "review" | "system" | "earnings";
}

export interface KPIBenchmark {
  score: number;
  label: string;
  information: string;
  benchmark: string;
}

export interface HealthScore {
  score: number;
  computationsTill: string;
  nextChangeAt: string;
  breakup: {
    classFeedback: KPIBenchmark;
    trialFeedback: KPIBenchmark;
    batchRetention: KPIBenchmark;
    trialConversion: KPIBenchmark;
  };
}

export interface EarningLine {
  id: ID;
  label: string;
  type: "base" | "incentive" | "bonus" | "deduction";
  amount: number;
}

export interface EarningStatement {
  id: ID;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  status: "upcoming" | "processing" | "paid";
  lines: EarningLine[];
  total: number;
  payoutDate?: string;
}

export interface Course {
  id: ID;
  title: string;
  instrument: Instrument;
  level: "Beginner" | "Intermediate" | "Advanced";
  durationWeeks: number;
  description: string;
}

export interface LearningModule {
  id: ID;
  title: string;
  category: string;
  durationMinutes: number;
  progressPercent: number;
  isCompleted: boolean;
  thumbnailColor: string;
}

export interface MessageChannel {
  id: ID;
  studentName: string;
  batchName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: ID;
  channelId: ID;
  sender: "teacher" | "student" | "guardian";
  senderName: string;
  text: string;
  sentAt: string;
}

export interface Resource {
  id: ID;
  title: string;
  type: "pdf" | "sheet-music" | "audio" | "video" | "worksheet";
  instrument: Instrument | "general";
  sizeLabel: string;
  updatedAt: string;
}

export interface MasterclassEvent {
  id: ID;
  title: string;
  host: string;
  instrument: Instrument | "general";
  date: string;
  startTime: string;
  durationMinutes: number;
  seatsTotal: number;
  seatsFilled: number;
  isRegistered: boolean;
}

export interface OpenMicEvent {
  id: ID;
  title: string;
  theme: string;
  date: string;
  startTime: string;
  venue: "Online" | "Studio";
  slotsTotal: number;
  slotsFilled: number;
  isRegistered: boolean;
}

export interface MusicTool {
  id: ID;
  name: string;
  description: string;
  category: "Metronome" | "Tuner" | "Recorder" | "Notation" | "Practice Pad";
}

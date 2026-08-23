/**
 * Domain models for the Muziclly Student Dashboard.
 *
 * This app is new work (no recovered/reference source exists for a student
 * dashboard) built to sit alongside the Teacher Dashboard and share its
 * design system exactly. The shapes below mirror the teacher app's own
 * modeling conventions (see the Teacher Dashboard's `src/domain/types.ts`)
 * from a student's point of view, so the two feel like one product family.
 */

export type ID = string;

export type Instrument = "piano" | "guitar" | "vocals" | "violin" | "drums" | "ukulele" | "flute" | "tabla";

export type SessionStatus = "scheduled" | "completed" | "cancelled" | "missed";
export type EnrollmentStatus = "active" | "paused" | "completed";
export type NotificationSeverity = "info" | "warning" | "critical" | "success";

export interface StudentProfile {
  id: ID;
  name: string;
  email: string;
  phone: string;
  guardianName?: string;
  guardianPhone?: string;
  photoUrl?: string;
  dob?: string;
  joinedDate: string;
  city: string;
  state: string;
  country: string;
  instruments: Instrument[];
  introduction: string;
  status: "active" | "onboarding" | "inactive";
}

export interface Teacher {
  id: ID;
  name: string;
  instrument: Instrument;
  photoUrl?: string;
  rating: number;
  introduction: string;
}

export interface Enrollment {
  id: ID;
  batchName: string;
  instrument: Instrument;
  teacherId: ID;
  teacherName: string;
  status: EnrollmentStatus;
  schedule: { day: string; startTime: string; endTime: string }[];
  startedOn: string;
  totalSessionsCompleted: number;
  totalHoursCompleted: number;
  nextSessionAt?: string;
  currentLevel: "Beginner" | "Intermediate" | "Advanced";
  progressPercent: number;
}

export interface Session {
  id: ID;
  enrollmentId: ID;
  batchName: string;
  teacherId: ID;
  teacherName: string;
  instrument: Instrument;
  sessionDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;
  durationMinutes: number;
  status: SessionStatus;
  sessionNum: number;
  notes?: string;
  hasRecording: boolean;
}

export interface PracticeLog {
  id: ID;
  date: string;
  minutes: number;
  instrument: Instrument;
  note?: string;
}

export interface Achievement {
  id: ID;
  title: string;
  description: string;
  earnedAt: string;
  icon: "streak" | "milestone" | "recital" | "level-up" | "attendance";
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
  category: "class" | "message" | "achievement" | "system" | "teacher";
}

export interface MessageChannel {
  id: ID;
  teacherId: ID;
  teacherName: string;
  batchName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: ID;
  channelId: ID;
  sender: "teacher" | "student";
  senderName: string;
  text: string;
  sentAt: string;
}

export interface Review {
  id: ID;
  teacherId: ID;
  teacherName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdAt: string;
  sessionId?: ID;
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

/**
 * Fictional mock dataset for the Muziclly Student Dashboard.
 *
 * This dashboard is original new work (no recovered source exists for it),
 * so every name, id and value here is invented purely for this project —
 * there's no reference capture to trace back to.
 */
import type {
  Achievement,
  ChatMessage,
  Enrollment,
  MasterclassEvent,
  MessageChannel,
  NotificationItem,
  OpenMicEvent,
  PracticeLog,
  Resource,
  Review,
  Session,
  StudentProfile,
  Teacher,
} from "@/domain/types";
import { addDaysISO, todayISO } from "@/lib/date";

const NOW = new Date();

export const student: StudentProfile = {
  id: "stu_ananya_rao",
  name: "Ananya Rao",
  email: "ananya.rao@muziclly.app",
  phone: "+91 90080 44112",
  guardianName: "Sunita Rao",
  guardianPhone: "+91 90080 44100",
  photoUrl: undefined,
  dob: "2012-09-02",
  joinedDate: "2024-11-04",
  city: "Pune",
  state: "Maharashtra",
  country: "IN",
  instruments: ["piano", "vocals"],
  introduction: "Learning piano and vocals — loves film music and is working toward her first recital.",
  status: "active",
};

export const teachers: Teacher[] = [
  {
    id: "tch_arjun_mehta",
    name: "Arjun Mehta",
    instrument: "piano",
    rating: 4.9,
    introduction: "Piano educator, Trinity College London certified, 10+ years training students across age groups.",
  },
  {
    id: "tch_meera_iyer",
    name: "Meera Iyer",
    instrument: "vocals",
    rating: 4.8,
    introduction: "Contemporary & classical vocal coach, focuses on breath control and stage confidence.",
  },
];

export const enrollments: Enrollment[] = [
  {
    id: "enr_piano_1",
    batchName: "Piano — Evening Batch B",
    instrument: "piano",
    teacherId: "tch_arjun_mehta",
    teacherName: "Arjun Mehta",
    status: "active",
    schedule: [
      { day: "Mon", startTime: "17:00", endTime: "17:45" },
      { day: "Thu", startTime: "17:00", endTime: "17:45" },
    ],
    startedOn: "2024-11-10",
    totalSessionsCompleted: 38,
    totalHoursCompleted: 28.5,
    nextSessionAt: addDaysISO(NOW, 2),
    currentLevel: "Intermediate",
    progressPercent: 62,
  },
  {
    id: "enr_vocals_1",
    batchName: "Vocals — Weekend Batch A",
    instrument: "vocals",
    teacherId: "tch_meera_iyer",
    teacherName: "Meera Iyer",
    status: "active",
    schedule: [{ day: "Sat", startTime: "10:00", endTime: "10:45" }],
    startedOn: "2025-02-15",
    totalSessionsCompleted: 14,
    totalHoursCompleted: 10.5,
    nextSessionAt: addDaysISO(NOW, 5),
    currentLevel: "Beginner",
    progressPercent: 28,
  },
];

export const sessions: Session[] = [
  {
    id: "ses_1",
    enrollmentId: "enr_piano_1",
    batchName: "Piano — Evening Batch B",
    teacherId: "tch_arjun_mehta",
    teacherName: "Arjun Mehta",
    instrument: "piano",
    sessionDate: addDaysISO(NOW, 2),
    startTime: "17:00",
    endTime: "17:45",
    durationMinutes: 45,
    status: "scheduled",
    sessionNum: 39,
    hasRecording: false,
  },
  {
    id: "ses_2",
    enrollmentId: "enr_vocals_1",
    batchName: "Vocals — Weekend Batch A",
    teacherId: "tch_meera_iyer",
    teacherName: "Meera Iyer",
    instrument: "vocals",
    sessionDate: addDaysISO(NOW, 5),
    startTime: "10:00",
    endTime: "10:45",
    durationMinutes: 45,
    status: "scheduled",
    sessionNum: 15,
    hasRecording: false,
  },
  {
    id: "ses_3",
    enrollmentId: "enr_piano_1",
    batchName: "Piano — Evening Batch B",
    teacherId: "tch_arjun_mehta",
    teacherName: "Arjun Mehta",
    instrument: "piano",
    sessionDate: addDaysISO(NOW, -2),
    startTime: "17:00",
    endTime: "17:45",
    durationMinutes: 45,
    status: "completed",
    sessionNum: 38,
    notes: "Worked on left-hand arpeggios for Clair de Lune. Keep practicing at 70 BPM before speeding up.",
    hasRecording: true,
  },
  {
    id: "ses_4",
    enrollmentId: "enr_vocals_1",
    batchName: "Vocals — Weekend Batch A",
    teacherId: "tch_meera_iyer",
    teacherName: "Meera Iyer",
    instrument: "vocals",
    sessionDate: addDaysISO(NOW, -9),
    startTime: "10:00",
    endTime: "10:45",
    durationMinutes: 45,
    status: "completed",
    sessionNum: 14,
    notes: "Good breath support today. Focus on pitch accuracy in the bridge section next time.",
    hasRecording: false,
  },
  {
    id: "ses_5",
    enrollmentId: "enr_piano_1",
    batchName: "Piano — Evening Batch B",
    teacherId: "tch_arjun_mehta",
    teacherName: "Arjun Mehta",
    instrument: "piano",
    sessionDate: addDaysISO(NOW, -6),
    startTime: "17:00",
    endTime: "17:45",
    durationMinutes: 45,
    status: "missed",
    sessionNum: 37,
    hasRecording: false,
  },
];

export const practiceLogs: PracticeLog[] = [
  { id: "prac_1", date: todayISO(), minutes: 25, instrument: "piano" },
  { id: "prac_2", date: addDaysISO(NOW, -1), minutes: 30, instrument: "piano", note: "Scales + Clair de Lune" },
  { id: "prac_3", date: addDaysISO(NOW, -2), minutes: 20, instrument: "vocals" },
  { id: "prac_4", date: addDaysISO(NOW, -3), minutes: 15, instrument: "piano" },
  { id: "prac_5", date: addDaysISO(NOW, -4), minutes: 35, instrument: "piano", note: "Sight-reading practice" },
  { id: "prac_6", date: addDaysISO(NOW, -5), minutes: 0, instrument: "piano" },
  { id: "prac_7", date: addDaysISO(NOW, -6), minutes: 22, instrument: "vocals" },
];

export const achievements: Achievement[] = [
  {
    id: "ach_1",
    title: "7-Day Practice Streak",
    description: "Practiced every day for a full week.",
    earnedAt: addDaysISO(NOW, -3),
    icon: "streak",
  },
  {
    id: "ach_2",
    title: "Level Up: Intermediate Piano",
    description: "Advanced from Beginner to Intermediate in Piano.",
    earnedAt: addDaysISO(NOW, -40),
    icon: "level-up",
  },
  {
    id: "ach_3",
    title: "30 Classes Completed",
    description: "Completed your 30th piano session.",
    earnedAt: addDaysISO(NOW, -20),
    icon: "milestone",
  },
];

export const notifications: NotificationItem[] = [
  {
    id: "not_1",
    title: "Upcoming class in 2 days",
    description: "Piano — Evening Batch B with Arjun Mehta.",
    severity: "info",
    createdAt: addDaysISO(NOW, 0),
    read: false,
    actionLabel: "View schedule",
    actionRoute: "/dashboard/schedule",
    category: "class",
  },
  {
    id: "not_2",
    title: "New message from Meera Iyer",
    description: "\"Great job on Saturday's warm-up exercises!\"",
    severity: "info",
    createdAt: addDaysISO(NOW, -1),
    read: false,
    actionLabel: "Open chat",
    actionRoute: "/dashboard/messages",
    category: "message",
  },
  {
    id: "not_3",
    title: "Achievement unlocked",
    description: "You earned the 7-Day Practice Streak badge.",
    severity: "success",
    createdAt: addDaysISO(NOW, -3),
    read: true,
    category: "achievement",
  },
  {
    id: "not_4",
    title: "Missed class",
    description: "You missed your Piano session on " + addDaysISO(NOW, -6) + ".",
    severity: "warning",
    createdAt: addDaysISO(NOW, -6),
    read: true,
    category: "class",
  },
];

export const messageChannels: MessageChannel[] = [
  {
    id: "chn_arjun",
    teacherId: "tch_arjun_mehta",
    teacherName: "Arjun Mehta",
    batchName: "Piano — Evening Batch B",
    lastMessage: "See you Thursday — don't forget to warm up first!",
    lastMessageAt: addDaysISO(NOW, -1),
    unreadCount: 0,
  },
  {
    id: "chn_meera",
    teacherId: "tch_meera_iyer",
    teacherName: "Meera Iyer",
    batchName: "Vocals — Weekend Batch A",
    lastMessage: "Great job on Saturday's warm-up exercises!",
    lastMessageAt: addDaysISO(NOW, -1),
    unreadCount: 1,
  },
];

export const chatMessages: ChatMessage[] = [
  { id: "msg_1", channelId: "chn_arjun", sender: "teacher", senderName: "Arjun Mehta", text: "Nice progress on the arpeggios today!", sentAt: addDaysISO(NOW, -2) },
  { id: "msg_2", channelId: "chn_arjun", sender: "student", senderName: "Ananya Rao", text: "Thank you! I'll keep practicing at 70 BPM.", sentAt: addDaysISO(NOW, -2) },
  { id: "msg_3", channelId: "chn_arjun", sender: "teacher", senderName: "Arjun Mehta", text: "See you Thursday — don't forget to warm up first!", sentAt: addDaysISO(NOW, -1) },
  { id: "msg_4", channelId: "chn_meera", sender: "teacher", senderName: "Meera Iyer", text: "Great job on Saturday's warm-up exercises!", sentAt: addDaysISO(NOW, -1) },
];

export const reviews: Review[] = [
  {
    id: "rev_1",
    teacherId: "tch_arjun_mehta",
    teacherName: "Arjun Mehta",
    rating: 5,
    comment: "Arjun explains things so clearly and is very patient!",
    createdAt: addDaysISO(NOW, -15),
  },
];

export const resources: Resource[] = [
  { id: "res_1", title: "Clair de Lune — Sheet Music (Simplified)", type: "sheet-music", instrument: "piano", sizeLabel: "1.2 MB", updatedAt: addDaysISO(NOW, -10) },
  { id: "res_2", title: "Major Scales Practice Sheet", type: "pdf", instrument: "piano", sizeLabel: "480 KB", updatedAt: addDaysISO(NOW, -20) },
  { id: "res_3", title: "Breath Control Warm-up (Audio)", type: "audio", instrument: "vocals", sizeLabel: "3.4 MB", updatedAt: addDaysISO(NOW, -8) },
  { id: "res_4", title: "Sight-Reading Basics (Video)", type: "video", instrument: "general", sizeLabel: "22 MB", updatedAt: addDaysISO(NOW, -30) },
];

export const masterclasses: MasterclassEvent[] = [
  {
    id: "mc_1",
    title: "Film Music Piano Masterclass",
    host: "Dr. Avishkar Roopi",
    instrument: "piano",
    date: addDaysISO(NOW, 12),
    startTime: "18:00",
    durationMinutes: 60,
    seatsTotal: 100,
    seatsFilled: 67,
    isRegistered: false,
  },
];

export const openMics: OpenMicEvent[] = [
  {
    id: "om_1",
    title: "Muziclly Open Mic — March Edition",
    theme: "Bollywood & Beyond",
    date: addDaysISO(NOW, 20),
    startTime: "19:00",
    venue: "Online",
    slotsTotal: 20,
    slotsFilled: 12,
    isRegistered: false,
  },
];

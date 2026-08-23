/**
 * Fictional mock dataset for the Muziclly Teachers Dashboard.
 *
 * Every name, id and value here is invented for this project. None of it is
 * copied from the Reference/ capture — only the *shape* of the data follows
 * the field inventory documented in Reference/SPARDHA_FORENSIC_ANALYSIS.md.
 */
import type {
  AvailabilitySlot,
  Batch,
  EarningStatement,
  HealthScore,
  Leave,
  LearningModule,
  MasterclassEvent,
  MeetingRequest,
  MessageChannel,
  ChatMessage,
  MusicTool,
  NotificationItem,
  OpenMicEvent,
  Resource,
  Review,
  Session,
  StaffContact,
  Student,
  Teacher,
  TrialOpportunity,
  Course,
} from "@/domain/types";
import { addDaysISO, todayISO } from "@/lib/date";
import { makeId } from "@/lib/id";

const NOW = new Date();

export const teacher: Teacher = {
  id: "tch_arjun_mehta",
  name: "Arjun Mehta",
  email: "arjun.mehta@muziclly.app",
  phone: "+91 98450 11223",
  emergencyPhone: "+91 98450 99887",
  gender: "M",
  role: "teacher",
  photoUrl: undefined,
  dob: "1990-03-14",
  joinedDate: "2023-06-01",
  city: "Bengaluru",
  state: "Karnataka",
  country: "IN",
  addressLine1: "4th Cross, Indiranagar",
  pincode: "560038",
  languages: ["English", "Hindi", "Kannada"],
  categories: ["piano", "guitar"],
  introduction:
    "Piano & guitar educator with 10+ years of experience training 400+ students across age groups. Trinity College London certified, passionate about building strong fundamentals through a performance-first approach.",
  isKidFriendly: true,
  isTrialEligible: true,
  batchLimit: 24,
  status: "active",
  meetingRoomId: "muz-room-482",
};

export const staffContacts: StaffContact[] = [
  {
    id: "stf_1",
    kind: "SME",
    name: "Priya Nataraj",
    email: "priya.nataraj@muziclly.app",
    phone: "+91 90210 33445",
    role: "Subject Matter Expert — Piano",
  },
  {
    id: "stf_2",
    kind: "TSM",
    name: "Karan Bedi",
    email: "karan.bedi@muziclly.app",
    phone: "+91 90210 55667",
    role: "Trainer Success Manager",
  },
  {
    id: "stf_3",
    kind: "Admin",
    name: "Fatima Sheikh",
    email: "fatima.sheikh@muziclly.app",
    phone: "+91 90210 77889",
    role: "Operations Support",
  },
];

const studentNames = [
  "Ishaan Verma",
  "Ananya Kapoor",
  "Kabir Malhotra",
  "Zara Sheikh",
  "Vihaan Rao",
  "Myra Joshi",
  "Advait Nair",
  "Riya Sen",
  "Arnav Kulkarni",
  "Sana Iyer",
  "Reyansh Gupta",
  "Diya Chatterjee",
];

export const students: Student[] = studentNames.map((name, i) => ({
  id: `stu_${i + 1}`,
  name,
  ageGroup: ["6-9 years", "10-12 years", "13-15 years", "16+ years"][i % 4],
  gender: i % 2 === 0 ? "Male" : "Female",
  guardianName: `${name.split(" ")[0]}'s Guardian`,
  guardianPhone: `+91 98${(100000 + i * 733).toString().slice(0, 8)}`,
  city: ["Bengaluru", "Mumbai", "Pune", "Hyderabad"][i % 4],
  region: "R-10",
  instrument: i % 3 === 0 ? "guitar" : "piano",
  batchId: i < 8 ? `batch_${(i % 4) + 1}` : undefined,
  joinedDate: addDaysISO(NOW, -(30 + i * 12)),
  notes: i % 3 === 0 ? "Prefers evening slots; working on sight-reading." : undefined,
  totalHoursCompleted: 6 + i * 3.5,
  status: i < 8 ? "active" : i < 10 ? "trial" : "paused",
}));

export const batches: Batch[] = [
  {
    id: "batch_1",
    name: "Piano Foundations — Weekday Evenings",
    instrument: "piano",
    status: "active",
    studentIds: ["stu_1", "stu_2", "stu_3"],
    schedule: [
      { day: "Mon", startTime: "17:00", endTime: "17:45" },
      { day: "Wed", startTime: "17:00", endTime: "17:45" },
    ],
    startedOn: addDaysISO(NOW, -120),
    totalSessionsDelivered: 28,
    totalHoursDelivered: 21,
    nextSessionAt: addDaysISO(NOW, 1),
  },
  {
    id: "batch_2",
    name: "Guitar Beginners — Weekend Batch",
    instrument: "guitar",
    status: "active",
    studentIds: ["stu_4", "stu_5"],
    schedule: [{ day: "Sat", startTime: "10:00", endTime: "11:00" }],
    startedOn: addDaysISO(NOW, -80),
    totalSessionsDelivered: 11,
    totalHoursDelivered: 11,
    nextSessionAt: addDaysISO(NOW, 3),
  },
  {
    id: "batch_3",
    name: "Piano Intermediate — Performance Track",
    instrument: "piano",
    status: "paused",
    studentIds: ["stu_6", "stu_7"],
    schedule: [{ day: "Tue", startTime: "18:00", endTime: "19:00" }],
    startedOn: addDaysISO(NOW, -200),
    totalSessionsDelivered: 42,
    totalHoursDelivered: 42,
  },
  {
    id: "batch_4",
    name: "Piano Kids Club",
    instrument: "piano",
    status: "active",
    studentIds: ["stu_8"],
    schedule: [{ day: "Fri", startTime: "16:00", endTime: "16:30" }],
    startedOn: addDaysISO(NOW, -45),
    totalSessionsDelivered: 9,
    totalHoursDelivered: 4.5,
    nextSessionAt: addDaysISO(NOW, 2),
  },
];

function s(
  dayOffset: number,
  startTime: string,
  durationMinutes: number,
  overrides: Partial<Session>,
): Session {
  const date = addDaysISO(NOW, dayOffset);
  const [h, m] = startTime.split(":").map(Number);
  const endMinutes = h * 60 + m + durationMinutes;
  const endTime = `${Math.floor(endMinutes / 60)
    .toString()
    .padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;
  return {
    id: makeId("ses"),
    recordType: "regular",
    batchName: "—",
    studentId: "stu_1",
    studentName: "—",
    instrument: "piano",
    region: "R-10",
    sessionDate: date,
    startTime,
    endTime,
    durationMinutes,
    status: "scheduled",
    sessionNum: 1,
    hasAiNotes: false,
    meetingRoomId: teacher.meetingRoomId,
    ...overrides,
  };
}

export const sessions: Session[] = [
  s(0, "16:00", 30, {
    recordType: "trial",
    batchId: undefined,
    batchName: "Piano Foundation (Trial)",
    studentId: "stu_9",
    studentName: "Arnav Kulkarni",
    notes: "First-time learner, very keen; keep it fun and encouraging.",
  }),
  s(0, "17:00", 45, {
    batchId: "batch_1",
    batchName: batches[0].name,
    studentId: "stu_1",
    studentName: "Ishaan Verma",
    sessionNum: 12,
  }),
  s(1, "17:00", 45, {
    batchId: "batch_1",
    batchName: batches[0].name,
    studentId: "stu_2",
    studentName: "Ananya Kapoor",
    sessionNum: 12,
  }),
  s(1, "19:30", 30, {
    recordType: "trial",
    instrument: "guitar",
    batchName: "Guitar Beginners (Trial)",
    studentId: "stu_10",
    studentName: "Sana Iyer",
    notes: "Has a home guitar, self-taught 3 chords, wants structured lessons.",
  }),
  s(2, "16:00", 30, {
    batchId: "batch_4",
    batchName: batches[3].name,
    studentId: "stu_8",
    studentName: "Riya Sen",
    sessionNum: 10,
  }),
  s(3, "10:00", 60, {
    instrument: "guitar",
    batchId: "batch_2",
    batchName: batches[1].name,
    studentId: "stu_4",
    studentName: "Zara Sheikh",
    sessionNum: 12,
  }),
  s(-1, "17:00", 45, {
    batchId: "batch_1",
    batchName: batches[0].name,
    studentId: "stu_3",
    studentName: "Kabir Malhotra",
    status: "completed",
    sessionNum: 11,
    hasAiNotes: true,
  }),
  s(-2, "18:00", 60, {
    batchId: "batch_3",
    batchName: batches[2].name,
    studentId: "stu_6",
    studentName: "Myra Joshi",
    status: "completed",
    sessionNum: 41,
    hasAiNotes: true,
  }),
  s(-3, "16:00", 30, {
    recordType: "trial",
    batchName: "Piano Foundation (Trial)",
    studentId: "stu_11",
    studentName: "Reyansh Gupta",
    status: "no-show",
  }),
];

export const trialOpportunities: TrialOpportunity[] = [
  {
    id: makeId("opp"),
    studentName: "Pragnay Bhardwaj",
    ageGroup: "10-12 years",
    studentGender: "Male",
    courseTitle: "Piano Foundation",
    instrument: "piano",
    region: "R-10",
    sessionDate: addDaysISO(NOW, 1),
    startTime: "20:00",
    postedAt: addDaysISO(NOW, 0),
    expiresAt: addDaysISO(NOW, 1),
  },
  {
    id: makeId("opp"),
    studentName: "Sujan Rao",
    ageGroup: "10-12 years",
    studentGender: "Male",
    courseTitle: "Piano Foundation",
    instrument: "piano",
    region: "R-10",
    sessionDate: addDaysISO(NOW, 1),
    startTime: "17:30",
    postedAt: addDaysISO(NOW, 0),
    expiresAt: addDaysISO(NOW, 1),
  },
  {
    id: makeId("opp"),
    studentName: "Noor Bakhtiyar",
    ageGroup: "10-12 years",
    studentGender: "Female",
    courseTitle: "Piano Foundation",
    instrument: "piano",
    region: "R-10",
    sessionDate: addDaysISO(NOW, 1),
    startTime: "19:30",
    postedAt: addDaysISO(NOW, 0),
    expiresAt: addDaysISO(NOW, 1),
  },
  {
    id: makeId("opp"),
    studentName: "Tara Khanna",
    ageGroup: "13-15 years",
    studentGender: "Female",
    courseTitle: "Guitar Beginners",
    instrument: "guitar",
    region: "R-10",
    sessionDate: addDaysISO(NOW, 2),
    startTime: "18:30",
    postedAt: addDaysISO(NOW, 0),
    expiresAt: addDaysISO(NOW, 2),
  },
];

export const availability: AvailabilitySlot[] = [
  { id: makeId("av"), day: "Mon", startTime: "16:00", endTime: "20:00", isTrialSlot: true },
  { id: makeId("av"), day: "Tue", startTime: "16:00", endTime: "20:00", isTrialSlot: false },
  { id: makeId("av"), day: "Wed", startTime: "16:00", endTime: "20:00", isTrialSlot: true },
  { id: makeId("av"), day: "Thu", startTime: "16:00", endTime: "19:00", isTrialSlot: false },
  { id: makeId("av"), day: "Fri", startTime: "15:00", endTime: "19:00", isTrialSlot: true },
  { id: makeId("av"), day: "Sat", startTime: "09:00", endTime: "13:00", isTrialSlot: false },
];

export const leaves: Leave[] = [
  {
    id: makeId("lv"),
    fromDate: addDaysISO(NOW, 10),
    toDate: addDaysISO(NOW, 11),
    reason: "Family function",
    status: "pending",
    appliedOn: addDaysISO(NOW, -1),
  },
  {
    id: makeId("lv"),
    fromDate: addDaysISO(NOW, -20),
    toDate: addDaysISO(NOW, -19),
    reason: "Medical",
    status: "approved",
    appliedOn: addDaysISO(NOW, -25),
    respondedOn: addDaysISO(NOW, -24),
    approverNote: "Approved, get well soon.",
  },
  {
    id: makeId("lv"),
    fromDate: addDaysISO(NOW, -45),
    toDate: addDaysISO(NOW, -45),
    reason: "Personal",
    status: "rejected",
    appliedOn: addDaysISO(NOW, -50),
    respondedOn: addDaysISO(NOW, -48),
    approverNote: "Clashes with 3 confirmed trial slots — please reschedule instead.",
  },
];

export const reviews: Review[] = [
  {
    id: makeId("rev"),
    studentName: "Ishaan Verma's parent",
    rating: 5,
    comment: "Arjun is incredibly patient and makes every class fun. Ishaan looks forward to it every week!",
    sentiment: "positive",
    createdAt: addDaysISO(NOW, -6),
    batchName: "Piano Foundations — Weekday Evenings",
  },
  {
    id: makeId("rev"),
    studentName: "Zara Sheikh's parent",
    rating: 4,
    comment: "Good structure, would love a bit more practice material between sessions.",
    sentiment: "positive",
    createdAt: addDaysISO(NOW, -14),
    batchName: "Guitar Beginners — Weekend Batch",
  },
  {
    id: makeId("rev"),
    studentName: "Myra Joshi's parent",
    rating: 3,
    comment: "Decent progress, a couple of sessions felt rushed.",
    sentiment: "neutral",
    createdAt: addDaysISO(NOW, -30),
    batchName: "Piano Intermediate — Performance Track",
  },
];

export const meetingRequests: MeetingRequest[] = [
  {
    id: makeId("mr"),
    withName: "Zara Sheikh's parent",
    withRole: "Guardian",
    requestedAt: addDaysISO(NOW, -1),
    proposedDate: addDaysISO(NOW, 2),
    status: "pending",
    reason: "Discuss progress and practice routine at home",
  },
  {
    id: makeId("mr"),
    withName: "Karan Bedi",
    withRole: "Trainer Success Manager",
    requestedAt: addDaysISO(NOW, -3),
    proposedDate: addDaysISO(NOW, -1),
    status: "completed",
    reason: "Quarterly performance check-in",
  },
];

export const notifications: NotificationItem[] = [
  {
    id: makeId("ntf"),
    title: "3 new trial opportunities available",
    description: "Piano & guitar trial slots matching your availability are open to claim.",
    severity: "info",
    createdAt: addDaysISO(NOW, 0),
    read: false,
    actionLabel: "View opportunities",
    actionRoute: "/dashboard/trials/opportunities",
    category: "trial",
  },
  {
    id: makeId("ntf"),
    title: "Meeting request from Zara Sheikh's parent",
    description: "Wants to discuss progress and practice routine.",
    severity: "warning",
    createdAt: addDaysISO(NOW, -1),
    read: false,
    actionLabel: "Respond",
    actionRoute: "/dashboard/contacts",
    category: "meeting",
  },
  {
    id: makeId("ntf"),
    title: "Leave request pending approval",
    description: `Your leave for ${addDaysISO(NOW, 10)} is awaiting manager approval.`,
    severity: "info",
    createdAt: addDaysISO(NOW, -1),
    read: true,
    actionLabel: "View leave",
    actionRoute: "/dashboard/leaves",
    category: "leave",
  },
  {
    id: makeId("ntf"),
    title: "New 5-star review received",
    description: "Ishaan Verma's parent left glowing feedback on your last session.",
    severity: "success",
    createdAt: addDaysISO(NOW, -6),
    read: true,
    actionLabel: "Read review",
    actionRoute: "/dashboard/reviews",
    category: "review",
  },
  {
    id: makeId("ntf"),
    title: "Health score refreshes in 7 days",
    description: "Keep completing sessions and collecting feedback to boost your score.",
    severity: "info",
    createdAt: addDaysISO(NOW, -2),
    read: true,
    category: "system",
  },
];

export const healthScore: HealthScore = {
  score: 87,
  computationsTill: todayISO(),
  nextChangeAt: addDaysISO(NOW, 7),
  breakup: {
    classFeedback: {
      score: 92,
      label: "Class Feedback",
      information:
        "Reflects feedback from both regular batch sessions and trial sessions. Low ratings (1–2) score 0%, average (3) scores 50%, high (4–5) scores 100%.",
      benchmark: "90%+ high-rated feedback",
    },
    trialFeedback: {
      score: 88,
      label: "Trial Feedback",
      information: "Share of trial sessions with fully favourable responses across all feedback questions.",
      benchmark: "All 3 questions positive",
    },
    batchRetention: {
      score: 78,
      label: "Batch Retention",
      information:
        "(Total hours delivered × 100) / 48, floored at 50 for any active batch. Rewards keeping students engaged for 24+ hours.",
      benchmark: "48 hrs/batch delivered",
    },
    trialConversion: {
      score: 90,
      label: "Trial Conversion",
      information: "Share of trial sessions that convert into a paid batch enrolment.",
      benchmark: "50% trials won",
    },
  },
};

export const earnings: EarningStatement[] = [
  {
    id: makeId("earn"),
    periodLabel: "August 2026",
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
    status: "processing",
    lines: [
      { id: makeId("ln"), label: "Base pay", type: "base", amount: 32000 },
      { id: makeId("ln"), label: "Trial conversion incentive", type: "incentive", amount: 4200 },
      { id: makeId("ln"), label: "Retention bonus", type: "bonus", amount: 1500 },
    ],
    total: 37700,
  },
  {
    id: makeId("earn"),
    periodLabel: "July 2026",
    periodStart: "2026-07-01",
    periodEnd: "2026-07-31",
    status: "paid",
    lines: [
      { id: makeId("ln"), label: "Base pay", type: "base", amount: 32000 },
      { id: makeId("ln"), label: "Trial conversion incentive", type: "incentive", amount: 3100 },
      { id: makeId("ln"), label: "Late cancellation", type: "deduction", amount: -500 },
    ],
    total: 34600,
    payoutDate: "2026-08-05",
  },
  {
    id: makeId("earn"),
    periodLabel: "June 2026",
    periodStart: "2026-06-01",
    periodEnd: "2026-06-30",
    status: "paid",
    lines: [
      { id: makeId("ln"), label: "Base pay", type: "base", amount: 30000 },
      { id: makeId("ln"), label: "Trial conversion incentive", type: "incentive", amount: 2600 },
    ],
    total: 32600,
    payoutDate: "2026-07-05",
  },
];

export const courses: Course[] = [
  {
    id: "course_1",
    title: "Piano Foundation",
    instrument: "piano",
    level: "Beginner",
    durationWeeks: 12,
    description: "Note reading, hand posture, rhythm fundamentals and first performance pieces.",
  },
  {
    id: "course_2",
    title: "Piano Performance Track",
    instrument: "piano",
    level: "Intermediate",
    durationWeeks: 16,
    description: "Repertoire building, sight-reading and stage-ready performance coaching.",
  },
  {
    id: "course_3",
    title: "Guitar Beginners",
    instrument: "guitar",
    level: "Beginner",
    durationWeeks: 10,
    description: "Open chords, strumming patterns, and first full songs.",
  },
];

export const learningModules: LearningModule[] = [
  {
    id: makeId("lm"),
    title: "Delivering Feedback That Motivates",
    category: "Teaching Craft",
    durationMinutes: 18,
    progressPercent: 100,
    isCompleted: true,
    thumbnailColor: "var(--color-brand-500)",
  },
  {
    id: makeId("lm"),
    title: "Running High-Converting Trial Sessions",
    category: "Trials",
    durationMinutes: 22,
    progressPercent: 60,
    isCompleted: false,
    thumbnailColor: "var(--color-accent-500)",
  },
  {
    id: makeId("lm"),
    title: "Teaching Rhythm to Young Beginners",
    category: "Piano",
    durationMinutes: 15,
    progressPercent: 0,
    isCompleted: false,
    thumbnailColor: "#22a06b",
  },
  {
    id: makeId("lm"),
    title: "Using AI Session Notes Effectively",
    category: "Platform",
    durationMinutes: 9,
    progressPercent: 0,
    isCompleted: false,
    thumbnailColor: "#2e7bd6",
  },
];

export const messageChannels: MessageChannel[] = [
  {
    id: "ch_1",
    studentName: "Ishaan Verma",
    batchName: "Piano Foundations — Weekday Evenings",
    lastMessage: "Thank you sir, practiced the C major scale daily!",
    lastMessageAt: addDaysISO(NOW, -1),
    unreadCount: 2,
  },
  {
    id: "ch_2",
    studentName: "Zara Sheikh",
    batchName: "Guitar Beginners — Weekend Batch",
    lastMessage: "Can we move Saturday's class by 30 mins?",
    lastMessageAt: addDaysISO(NOW, 0),
    unreadCount: 1,
  },
  {
    id: "ch_3",
    studentName: "Myra Joshi",
    batchName: "Piano Intermediate — Performance Track",
    lastMessage: "Sent the recording of my practice, please check!",
    lastMessageAt: addDaysISO(NOW, -4),
    unreadCount: 0,
  },
];

export const chatMessages: ChatMessage[] = [
  {
    id: makeId("msg"),
    channelId: "ch_1",
    sender: "student",
    senderName: "Ishaan Verma",
    text: "Hi sir, I practiced the C major scale every day this week!",
    sentAt: addDaysISO(NOW, -1),
  },
  {
    id: makeId("msg"),
    channelId: "ch_1",
    sender: "teacher",
    senderName: teacher.name,
    text: "That's fantastic, Ishaan! We'll build on that in tomorrow's class.",
    sentAt: addDaysISO(NOW, -1),
  },
  {
    id: makeId("msg"),
    channelId: "ch_2",
    sender: "guardian",
    senderName: "Zara's parent",
    text: "Can we move Saturday's class by 30 mins? She has a school event.",
    sentAt: addDaysISO(NOW, 0),
  },
];

export const resources: Resource[] = [
  {
    id: makeId("res"),
    title: "Piano Foundation — Week 1-4 Sheet Pack",
    type: "sheet-music",
    instrument: "piano",
    sizeLabel: "2.1 MB",
    updatedAt: addDaysISO(NOW, -30),
  },
  {
    id: makeId("res"),
    title: "Beginner Guitar Chord Chart",
    type: "pdf",
    instrument: "guitar",
    sizeLabel: "640 KB",
    updatedAt: addDaysISO(NOW, -12),
  },
  {
    id: makeId("res"),
    title: "Rhythm Practice Backing Tracks",
    type: "audio",
    instrument: "general",
    sizeLabel: "18 MB",
    updatedAt: addDaysISO(NOW, -60),
  },
  {
    id: makeId("res"),
    title: "Sight-Reading Worksheet Generator Guide",
    type: "worksheet",
    instrument: "piano",
    sizeLabel: "310 KB",
    updatedAt: addDaysISO(NOW, -5),
  },
  {
    id: makeId("res"),
    title: "Recording a Great Practice Video — Tutorial",
    type: "video",
    instrument: "general",
    sizeLabel: "84 MB",
    updatedAt: addDaysISO(NOW, -18),
  },
];

export const masterclasses: MasterclassEvent[] = [
  {
    id: makeId("mc"),
    title: "Expressive Dynamics on Piano",
    host: "Meera Krishnan",
    instrument: "piano",
    date: addDaysISO(NOW, 5),
    startTime: "19:00",
    durationMinutes: 60,
    seatsTotal: 200,
    seatsFilled: 148,
    isRegistered: true,
  },
  {
    id: makeId("mc"),
    title: "Fingerstyle Foundations",
    host: "Rohan D'Souza",
    instrument: "guitar",
    date: addDaysISO(NOW, 12),
    startTime: "18:30",
    durationMinutes: 75,
    seatsTotal: 150,
    seatsFilled: 62,
    isRegistered: false,
  },
];

export const openMicEvents: OpenMicEvent[] = [
  {
    id: makeId("om"),
    title: "Monsoon Melodies — Open Mic",
    theme: "Rainy Day Songs",
    date: addDaysISO(NOW, 8),
    startTime: "20:00",
    venue: "Online",
    slotsTotal: 20,
    slotsFilled: 14,
    isRegistered: false,
  },
  {
    id: makeId("om"),
    title: "Student Showcase Night",
    theme: "Student Performances",
    date: addDaysISO(NOW, 21),
    startTime: "19:30",
    venue: "Studio",
    slotsTotal: 15,
    slotsFilled: 15,
    isRegistered: true,
  },
];

export const musicTools: MusicTool[] = [
  { id: "mt_1", name: "Metronome", description: "Adjustable BPM click track for practice and class use.", category: "Metronome" },
  { id: "mt_2", name: "Chromatic Tuner", description: "Real-time pitch detection for piano, guitar and vocals.", category: "Tuner" },
  { id: "mt_3", name: "Session Recorder", description: "Record and share short practice or demo clips.", category: "Recorder" },
  { id: "mt_4", name: "Notation Scratchpad", description: "Quickly sketch a phrase or exercise to share with a student.", category: "Notation" },
  { id: "mt_5", name: "Rhythm Practice Pad", description: "Tap-along rhythm trainer for young beginners.", category: "Practice Pad" },
];

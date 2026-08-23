// Recovered verbatim from the original production bundle
// (_next/static/chunks/62de1471182e9679.js): the six Forum Hub form
// definitions the site owner uses for enrollment/enquiry intake.
import { User, Calendar, Briefcase, GraduationCap, MessageCircle, CircleQuestionMark, type LucideIcon } from "lucide-react";

export type FieldType = "text" | "number" | "email" | "tel" | "date" | "time" | "select" | "textarea" | "file";

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

export interface FormDef {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  fields: FormField[];
}

export const forms: FormDef[] = [
  {
    id: "student-registration",
    title: "Student Registration",
    icon: User,
    description: "Enroll in our structured music learning programs.",
    fields: [
      { name: "studentName", label: "Student Full Name", type: "text", required: true },
      { name: "age", label: "Age", type: "number", required: true },
      {
        name: "course",
        label: "Course",
        type: "select",
        required: true,
        options: ["Keyboard / Piano", "Guitar", "Vocals", "Drums", "Audio Engineering", "Music Composition with Software Training"],
      },
      { name: "level", label: "Level", type: "select", required: true, options: ["Beginner", "Intermediate", "Advanced"] },
      { name: "parentName", label: "Parent Name (for minors)", type: "text", required: false },
      { name: "whatsapp", label: "WhatsApp Number", type: "tel", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "classMode", label: "Preferred Class Mode", type: "select", required: true, options: ["Online", "Offline"] },
      { name: "city", label: "City", type: "text", required: true },
    ],
  },
  {
    id: "demo-booking",
    title: "Demo Class Booking",
    icon: Calendar,
    description: "Experience our teaching style with a free demo.",
    fields: [
      { name: "studentName", label: "Student Name", type: "text", required: true },
      {
        name: "course",
        label: "Course",
        type: "select",
        required: true,
        options: ["Keyboard / Piano", "Guitar", "Vocals", "Drums", "Audio Engineering", "Music Composition with Software Training"],
      },
      { name: "preferredDate", label: "Preferred Date", type: "date", required: true },
      { name: "preferredTime", label: "Preferred Time Slot", type: "time", required: true },
      { name: "whatsapp", label: "WhatsApp Number", type: "tel", required: true },
      { name: "email", label: "Email", type: "email", required: true },
    ],
  },
  {
    id: "teacher-registration",
    title: "Teacher Registration",
    icon: Briefcase,
    description: "Join our team of expert music mentors.",
    fields: [
      { name: "fullName", label: "Full Name", type: "text", required: true },
      { name: "primaryInstrument", label: "Primary Instrument", type: "text", required: true },
      { name: "experience", label: "Teaching Experience (Years)", type: "number", required: true },
      { name: "certifications", label: "Certifications", type: "textarea", required: false },
      { name: "city", label: "City", type: "text", required: true },
      { name: "whatsapp", label: "WhatsApp Number", type: "tel", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "resume", label: "Resume (Upload)", type: "file", required: true },
    ],
  },
  {
    id: "teacher-training",
    title: "Teacher Training",
    icon: GraduationCap,
    description: "For Freshers & Housewives starting a music career.",
    fields: [
      { name: "fullName", label: "Full Name", type: "text", required: true },
      { name: "age", label: "Age", type: "number", required: true },
      { name: "education", label: "Educational Background", type: "textarea", required: true },
      { name: "musicKnowledge", label: "Music Knowledge Level", type: "select", required: true, options: ["None", "Basic", "Intermediate"] },
      { name: "city", label: "City", type: "text", required: true },
      { name: "whatsapp", label: "WhatsApp Number", type: "tel", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "reason", label: "Reason for Joining", type: "textarea", required: true },
    ],
  },
  {
    id: "enquiry",
    title: "General Enquiry",
    icon: MessageCircle,
    description: "Have questions? Reach out to us.",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "whatsapp", label: "WhatsApp Number", type: "tel", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "enquiryType", label: "Enquiry Type", type: "select", required: true, options: ["Courses", "Fees", "Timings", "General"] },
      { name: "message", label: "Message", type: "textarea", required: true },
    ],
  },
  {
    id: "support",
    title: "Support Ticket",
    icon: CircleQuestionMark,
    description: "Get help with your classes or account.",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "role", label: "Role", type: "select", required: true, options: ["Student", "Parent", "Teacher"] },
      { name: "registeredEmail", label: "Registered Email", type: "email", required: true },
      { name: "issueCategory", label: "Issue Category", type: "select", required: true, options: ["Class", "Payment", "Technical", "Other"] },
      { name: "issueDescription", label: "Issue Description", type: "textarea", required: true },
      { name: "priority", label: "Priority", type: "select", required: true, options: ["Low", "Medium", "High"] },
    ],
  },
];

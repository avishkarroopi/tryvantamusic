import type { LucideIcon } from "lucide-react";
import {
  Bot,
  CalendarClock,
  CalendarDays,
  CircleDollarSign,
  Contact2,
  GraduationCap,
  Guitar,
  HelpCircle,
  LayoutGrid,
  LibraryBig,
  MessageSquareText,
  Mic2,
  Music4,
  Piano,
  PlaneTakeoff,
  Radio,
  Sparkles,
  Star,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badgeKey?: "notifications" | "messages" | "opportunities";
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/** Sidebar information architecture — see Reference/SPARDHA_FORENSIC_ANALYSIS.md §3 & §6. */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutGrid }],
  },
  {
    label: "Teaching",
    items: [
      { label: "Live Classroom", to: "/dashboard/live-classroom", icon: Radio },
      { label: "Batches", to: "/dashboard/batches", icon: Piano },
      { label: "Students", to: "/dashboard/students", icon: Users },
      { label: "Trial Sessions", to: "/dashboard/trials", icon: Sparkles, badgeKey: "opportunities" },
      { label: "My Availability", to: "/dashboard/availability", icon: CalendarClock },
      { label: "My Schedule", to: "/dashboard/schedule", icon: CalendarDays },
      { label: "My Leaves", to: "/dashboard/leaves", icon: PlaneTakeoff },
    ],
  },
  {
    label: "Engagement",
    items: [
      { label: "Reviews", to: "/dashboard/reviews", icon: Star },
      { label: "Contacts", to: "/dashboard/contacts", icon: Contact2 },
      { label: "Notifications", to: "/dashboard/notifications", icon: MessageSquareText, badgeKey: "notifications" },
      { label: "Chat With Students", to: "/dashboard/messages", icon: MessageSquareText, badgeKey: "messages" },
    ],
  },
  {
    label: "Grow & Earn",
    items: [
      { label: "Earnings", to: "/dashboard/earnings", icon: CircleDollarSign },
      { label: "My Learning", to: "/dashboard/learning", icon: GraduationCap },
    ],
  },
  {
    label: "Community",
    items: [
      { label: "Masterclass", to: "/dashboard/masterclass", icon: Trophy },
      { label: "Open Mic", to: "/dashboard/open-mic", icon: Mic2 },
      { label: "Global Idol", to: "/dashboard/global-idol", icon: Trophy },
    ],
  },
  {
    label: "Studio & Tools",
    items: [
      { label: "Music Studio", to: "/dashboard/music-studio", icon: Music4 },
      { label: "Jam Station", to: "/dashboard/jam-station", icon: Guitar },
      { label: "Resource Library", to: "/dashboard/resource-library", icon: LibraryBig },
      { label: "Music Tools", to: "/dashboard/music-tools", icon: Wrench },
      { label: "Muziclly Buddy AI", to: "/dashboard/buddy-ai", icon: Bot },
    ],
  },
  {
    label: "Support",
    items: [{ label: "Help Center", to: "/dashboard/help", icon: HelpCircle }],
  },
];

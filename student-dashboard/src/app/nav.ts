import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  Contact2,
  HelpCircle,
  LayoutGrid,
  LibraryBig,
  MessageSquareText,
  Radio,
  Star,
  Trophy,
  Mic2,
  Wrench,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badgeKey?: "notifications" | "messages";
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/** Sidebar information architecture for the Student Dashboard — new work, mirrors
 *  the Teacher Dashboard's IA shape from a student's point of view. */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutGrid }],
  },
  {
    label: "Learning",
    items: [
      { label: "Live Classroom", to: "/dashboard/live-classroom", icon: Radio },
      { label: "My Classes", to: "/dashboard/classes", icon: BookOpen },
      { label: "My Schedule", to: "/dashboard/schedule", icon: CalendarDays },
      { label: "My Teachers", to: "/dashboard/teachers", icon: Contact2 },
      { label: "Resource Library", to: "/dashboard/resource-library", icon: LibraryBig },
      { label: "Music Tools", to: "/dashboard/music-tools", icon: Wrench },
    ],
  },
  {
    label: "Engagement",
    items: [
      { label: "Notifications", to: "/dashboard/notifications", icon: MessageSquareText, badgeKey: "notifications" },
      { label: "Messages", to: "/dashboard/messages", icon: MessageSquareText, badgeKey: "messages" },
      { label: "Reviews", to: "/dashboard/reviews", icon: Star },
    ],
  },
  {
    label: "Community",
    items: [
      { label: "Masterclass", to: "/dashboard/masterclass", icon: Trophy },
      { label: "Open Mic", to: "/dashboard/open-mic", icon: Mic2 },
    ],
  },
  {
    label: "Support",
    items: [{ label: "Help Center", to: "/dashboard/help", icon: HelpCircle }],
  },
];

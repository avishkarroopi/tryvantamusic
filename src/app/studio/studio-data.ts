// Recovered verbatim from the original production bundle
// (_next/static/chunks/3bc884c937096d3f.js).
export interface SubItem {
  title: string;
  link: string;
}

export interface StudioFeature {
  icon: string;
  title: string;
  desc: string;
  link?: string;
  subItems?: SubItem[];
}

export const studioFeatures: StudioFeature[] = [
  {
    icon: "👨‍🏫",
    title: "Muziclly Mentor Section",
    desc: "Connect with expert mentors for 1-on-1 guidance, feedback, and personalized roadmaps.",
    subItems: [
      { title: "Career and job portal", link: "#" },
      { title: "Our mentor", link: "#" },
      { title: "Teacher Training", link: "#" },
      { title: "House wife program", link: "#" },
    ],
  },
  { icon: "🛒", title: "Muziclly Store", desc: "Your one-stop shop for expertly curated instruments, accessories, and exclusive merchandise.", link: "/mstore" },
  { icon: "💿", title: "Muziclly Label", desc: "Get discovered, distributed, and managed like a pro with our in-house record label." },
  {
    icon: "🎸",
    title: "M- Jam",
    desc: "The ultimate community hub for musicians to jam, collaborate, and vibe together.",
    subItems: [
      { title: "Live classes", link: "#" },
      { title: "Competitions", link: "#" },
      { title: "Chat & Messaging", link: "#" },
      { title: "Community Forum", link: "#" },
      { title: "Music festival & events", link: "#" },
      { title: "Band Creation", link: "#" },
      { title: "Near by musicians", link: "#" },
      { title: "JAM Room", link: "#" },
      { title: "Music Reels", link: "#" },
    ],
  },
  { icon: "🎁", title: "Refer & Earn", desc: "Invite friends to learn and earn credits towards your classes." },
  { icon: "🔐", title: "Auth & User Mgmt", desc: "Secure login for students, teachers, and parents with role-based access.", link: "/signin" },
  { icon: "⚙️", title: "Admin Panel", desc: "Robust backend for academy management and analytics.", link: "/admin" },
  { icon: "📚", title: "Course Catalog", desc: "Browse and enroll in structured courses for Piano, Guitar, and Singing." },
  { icon: "📋", title: "Detail & Syllabus", desc: "Deep dive into curriculum details, lesson plans, and learning outcomes." },
  { icon: "▶️", title: "Lesson Player", desc: "Interactive video player with speed control, looping, and notes." },
  { icon: "🎚️", title: "Practice Tools", desc: "Built-in metronome, BPM tapper, and tuner for daily warmups.", link: "/mlab" },
  { icon: "📤", title: "Media Upload", desc: "Submit audio and video recordings of your practice for review." },
  { icon: "📝", title: "Assignments & Feedback", desc: "Receive graded assignments and personalized video feedback from mentors." },
  { icon: "👨‍👩‍👧", title: "Parent Dashboard", desc: "Monitor child's attendance, progress reports, and teacher notes." },
  { icon: "🏆", title: "Certificates & Badges", desc: "Earn digital certificates and gamified badges for milestones." },
  { icon: "👨‍🏫", title: "Teacher Dashboard", desc: "Tools for mentors to manage schedules, students, and income.", link: "/teacher" },
  { icon: "💳", title: "Payments", desc: "Seamless subscription management and secure billing." },
  { icon: "🤖", title: "AI Music Tools", desc: "Smart practice assistants and AI-driven feedback.", link: "/mlab" },
  { icon: "🔔", title: "Notifications", desc: "Smart reminders for classes, practice, and assignments." },
  { icon: "👤", title: "Profile & Settings", desc: "Manage your musical identity, privacy, and preferences." },
];

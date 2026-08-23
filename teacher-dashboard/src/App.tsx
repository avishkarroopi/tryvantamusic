import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { PageLoader } from "@/components/ui/PageLoader";

const LoginPage = lazy(() => import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const BatchesPage = lazy(() => import("@/pages/batches/BatchesPage").then((m) => ({ default: m.BatchesPage })));
const BatchDetailPage = lazy(() => import("@/pages/batches/BatchDetailPage").then((m) => ({ default: m.BatchDetailPage })));
const StudentsPage = lazy(() => import("@/pages/students/StudentsPage").then((m) => ({ default: m.StudentsPage })));
const StudentDetailPage = lazy(() => import("@/pages/students/StudentDetailPage").then((m) => ({ default: m.StudentDetailPage })));
const TrialSessionsPage = lazy(() => import("@/pages/trials/TrialSessionsPage").then((m) => ({ default: m.TrialSessionsPage })));
const TrialOpportunitiesPage = lazy(() =>
  import("@/pages/trials/TrialOpportunitiesPage").then((m) => ({ default: m.TrialOpportunitiesPage })),
);
const AvailabilityPage = lazy(() => import("@/pages/availability/AvailabilityPage").then((m) => ({ default: m.AvailabilityPage })));
const SchedulePage = lazy(() => import("@/pages/schedule/SchedulePage").then((m) => ({ default: m.SchedulePage })));
const LeavesPage = lazy(() => import("@/pages/leaves/LeavesPage").then((m) => ({ default: m.LeavesPage })));
const ReviewsPage = lazy(() => import("@/pages/reviews/ReviewsPage").then((m) => ({ default: m.ReviewsPage })));
const ContactsPage = lazy(() => import("@/pages/contacts/ContactsPage").then((m) => ({ default: m.ContactsPage })));
const NotificationsPage = lazy(() => import("@/pages/notifications/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));
const ProfilePage = lazy(() => import("@/pages/profile/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const HelpCenterPage = lazy(() => import("@/pages/help/HelpCenterPage").then((m) => ({ default: m.HelpCenterPage })));
const EarningsPage = lazy(() => import("@/pages/earnings/EarningsPage").then((m) => ({ default: m.EarningsPage })));
const LearningPage = lazy(() => import("@/pages/learning/LearningPage").then((m) => ({ default: m.LearningPage })));
const MusicStudioPage = lazy(() => import("@/pages/musicStudio/MusicStudioPage").then((m) => ({ default: m.MusicStudioPage })));
const JamStationPage = lazy(() => import("@/pages/jamStation/JamStationPage").then((m) => ({ default: m.JamStationPage })));
const ResourceLibraryPage = lazy(() =>
  import("@/pages/resourceLibrary/ResourceLibraryPage").then((m) => ({ default: m.ResourceLibraryPage })),
);
const MusicToolsPage = lazy(() => import("@/pages/musicTools/MusicToolsPage").then((m) => ({ default: m.MusicToolsPage })));
const MessagesPage = lazy(() => import("@/pages/messages/MessagesPage").then((m) => ({ default: m.MessagesPage })));
const MasterclassPage = lazy(() => import("@/pages/masterclass/MasterclassPage").then((m) => ({ default: m.MasterclassPage })));
const OpenMicPage = lazy(() => import("@/pages/openMic/OpenMicPage").then((m) => ({ default: m.OpenMicPage })));
const GlobalIdolPage = lazy(() => import("@/pages/globalIdol/GlobalIdolPage").then((m) => ({ default: m.GlobalIdolPage })));
const BuddyAIPage = lazy(() => import("@/pages/buddyAI/BuddyAIPage").then((m) => ({ default: m.BuddyAIPage })));
const LiveClassroomLauncherPage = lazy(() =>
  import("@/pages/liveClassroom/LiveClassroomLauncherPage").then((m) => ({ default: m.LiveClassroomLauncherPage })),
);
const LiveClassroomRoomPage = lazy(() =>
  import("@/pages/liveClassroom/LiveClassroomRoomPage").then((m) => ({ default: m.LiveClassroomRoomPage })),
);
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/batches" element={<BatchesPage />} />
          <Route path="/dashboard/batches/:batchId" element={<BatchDetailPage />} />
          <Route path="/dashboard/students" element={<StudentsPage />} />
          <Route path="/dashboard/students/:studentId" element={<StudentDetailPage />} />
          <Route path="/dashboard/trials" element={<TrialSessionsPage />} />
          <Route path="/dashboard/trials/opportunities" element={<TrialOpportunitiesPage />} />
          <Route path="/dashboard/availability" element={<AvailabilityPage />} />
          <Route path="/dashboard/schedule" element={<SchedulePage />} />
          <Route path="/dashboard/leaves" element={<LeavesPage />} />
          <Route path="/dashboard/reviews" element={<ReviewsPage />} />
          <Route path="/dashboard/contacts" element={<ContactsPage />} />
          <Route path="/dashboard/notifications" element={<NotificationsPage />} />
          <Route path="/dashboard/profile" element={<ProfilePage />} />
          <Route path="/dashboard/help" element={<HelpCenterPage />} />
          <Route path="/dashboard/earnings" element={<EarningsPage />} />
          <Route path="/dashboard/learning" element={<LearningPage />} />
          <Route path="/dashboard/music-studio" element={<MusicStudioPage />} />
          <Route path="/dashboard/jam-station" element={<JamStationPage />} />
          <Route path="/dashboard/resource-library" element={<ResourceLibraryPage />} />
          <Route path="/dashboard/music-tools" element={<MusicToolsPage />} />
          <Route path="/dashboard/messages" element={<MessagesPage />} />
          <Route path="/dashboard/messages/:channelId" element={<MessagesPage />} />
          <Route path="/dashboard/masterclass" element={<MasterclassPage />} />
          <Route path="/dashboard/open-mic" element={<OpenMicPage />} />
          <Route path="/dashboard/global-idol" element={<GlobalIdolPage />} />
          <Route path="/dashboard/buddy-ai" element={<BuddyAIPage />} />
          <Route path="/dashboard/live-classroom" element={<LiveClassroomLauncherPage />} />
        </Route>

        {/* Full-screen immersive room — deliberately outside AppShell, same
            pattern as most live-meeting products (Zoom/Meet full-screen call
            view). See M-CAM_PRODUCTION_INTEGRATION_STATUS.md. */}
        <Route path="/dashboard/live-classroom/:batchId" element={<LiveClassroomRoomPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

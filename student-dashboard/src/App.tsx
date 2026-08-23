import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { PageLoader } from "@/components/ui/PageLoader";

const LoginPage = lazy(() => import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ClassesPage = lazy(() => import("@/pages/classes/ClassesPage").then((m) => ({ default: m.ClassesPage })));
const SchedulePage = lazy(() => import("@/pages/schedule/SchedulePage").then((m) => ({ default: m.SchedulePage })));
const TeachersPage = lazy(() => import("@/pages/teachers/TeachersPage").then((m) => ({ default: m.TeachersPage })));
const NotificationsPage = lazy(() => import("@/pages/notifications/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));
const MessagesPage = lazy(() => import("@/pages/messages/MessagesPage").then((m) => ({ default: m.MessagesPage })));
const ReviewsPage = lazy(() => import("@/pages/reviews/ReviewsPage").then((m) => ({ default: m.ReviewsPage })));
const ResourceLibraryPage = lazy(() =>
  import("@/pages/resourceLibrary/ResourceLibraryPage").then((m) => ({ default: m.ResourceLibraryPage })),
);
const MasterclassPage = lazy(() => import("@/pages/masterclass/MasterclassPage").then((m) => ({ default: m.MasterclassPage })));
const OpenMicPage = lazy(() => import("@/pages/openMic/OpenMicPage").then((m) => ({ default: m.OpenMicPage })));
const HelpCenterPage = lazy(() => import("@/pages/help/HelpCenterPage").then((m) => ({ default: m.HelpCenterPage })));
const MusicToolsPage = lazy(() => import("@/pages/musicTools/MusicToolsPage").then((m) => ({ default: m.MusicToolsPage })));
const ProfilePage = lazy(() => import("@/pages/profile/ProfilePage").then((m) => ({ default: m.ProfilePage })));
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
          <Route path="/dashboard/classes" element={<ClassesPage />} />
          <Route path="/dashboard/schedule" element={<SchedulePage />} />
          <Route path="/dashboard/teachers" element={<TeachersPage />} />
          <Route path="/dashboard/notifications" element={<NotificationsPage />} />
          <Route path="/dashboard/messages" element={<MessagesPage />} />
          <Route path="/dashboard/messages/:channelId" element={<MessagesPage />} />
          <Route path="/dashboard/reviews" element={<ReviewsPage />} />
          <Route path="/dashboard/resource-library" element={<ResourceLibraryPage />} />
          <Route path="/dashboard/masterclass" element={<MasterclassPage />} />
          <Route path="/dashboard/open-mic" element={<OpenMicPage />} />
          <Route path="/dashboard/help" element={<HelpCenterPage />} />
          <Route path="/dashboard/music-tools" element={<MusicToolsPage />} />
          <Route path="/dashboard/profile" element={<ProfilePage />} />
          <Route path="/dashboard/live-classroom" element={<LiveClassroomLauncherPage />} />
        </Route>

        {/* Full-screen immersive room — deliberately outside AppShell, same
            pattern as the Teacher Dashboard's Room page. */}
        <Route path="/dashboard/live-classroom/:enrollmentId" element={<LiveClassroomRoomPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

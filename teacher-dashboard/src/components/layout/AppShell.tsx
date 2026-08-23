import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/app/SidebarProvider";
import { DesktopSidebar, MobileSidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { SupportChatWidget } from "./SupportChatWidget";

export function AppShell() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
        <DesktopSidebar />
        <MobileSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <SupportChatWidget />
    </SidebarProvider>
  );
}

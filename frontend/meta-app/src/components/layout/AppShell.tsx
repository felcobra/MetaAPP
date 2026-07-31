"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  pageTitle: string;
  children: ReactNode;
  showSidebar?: boolean;
}

export function AppShell({ pageTitle, children, showSidebar = true }: AppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  function handleMenuClick() {
    if (!showSidebar) return;

    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setDesktopSidebarOpen((current) => !current);
      return;
    }

    setMobileSidebarOpen(true);
  }

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      {showSidebar ? (
        <Sidebar
          open={mobileSidebarOpen}
          desktopOpen={desktopSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
      ) : null}
      <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col">
        <TopBar
          pageTitle={pageTitle}
          sidebarExpanded={showSidebar ? desktopSidebarOpen : false}
          onMenuClick={handleMenuClick}
        />
        <main className="min-w-0 flex-1 bg-surface px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

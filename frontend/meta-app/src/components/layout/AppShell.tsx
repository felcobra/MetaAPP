"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  pageTitle: string;
  children: ReactNode;
}

export function AppShell({ pageTitle, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col">
        <TopBar pageTitle={pageTitle} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 bg-surface px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

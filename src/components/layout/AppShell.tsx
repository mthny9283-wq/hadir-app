"use client";

import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import ToastContainer from "@/components/ui/Toast";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <ToastContainer />
      <Sidebar />
      <MobileNav />

      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <ThemeToggle />
      </div>

      <main className="lg:mr-64 min-h-screen pb-20 lg:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

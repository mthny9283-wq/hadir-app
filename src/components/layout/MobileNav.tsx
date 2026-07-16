"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, BookOpen, BarChart3, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/students", label: "الطلاب", icon: Users },
  { href: "/subjects", label: "المواد", icon: BookOpen },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex items-center justify-around px-1 z-40 lg:hidden pb-[env(safe-area-inset-bottom)]">
      {navLinks.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-xl text-[10px] font-medium transition-all duration-200 min-w-[56px] min-h-[48px]",
              isActive
                ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30"
                : "text-gray-500 hover:text-gray-700 active:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:active:bg-slate-700"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="leading-none">{label}</span>
          </Link>
        );
      })}
      <button
        onClick={handleLogout}
        className="flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-xl text-[10px] font-medium transition-all duration-200 min-w-[56px] min-h-[48px] text-red-500 active:bg-red-50 dark:text-red-400 dark:active:bg-red-900/20"
      >
        <LogOut className="h-5 w-5" />
        <span className="leading-none">خروج</span>
      </button>
    </nav>
  );
}

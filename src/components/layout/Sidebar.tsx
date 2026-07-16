"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, LayoutDashboard, Users, BookOpen, BarChart3, Settings, LogOut, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/ThemeToggle";

const navLinks = [
  { href: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/students", label: "الطلاب", icon: Users },
  { href: "/subjects", label: "المواد", icon: BookOpen },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
  { href: "/settings", label: "الإعدادات", icon: Settings },
  { href: "/admin/accounts", label: "الحسابات", icon: UserCog },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="hidden lg:flex fixed right-0 top-0 bottom-0 w-64 flex-col bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 z-40">
      <div className="flex items-center justify-between px-6 h-16 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-blue-600" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">حاضر</span>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200 dark:border-slate-700">
        <Link
          href="/about"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname === "/about"
              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-white"
          )}
        >
          فريق التطوير
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          تسجيل الخروج
        </button>
        <div className="mt-3 px-3">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">جامعة ذمار</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">كلية الحاسبات والمعلوماتية</p>
          <p className="text-xs text-blue-500 font-medium mt-1">فريق طليعة الأمن السيبراني</p>
          <p className="text-xs text-blue-400">CYBER VANGUARD</p>
        </div>
      </div>
    </aside>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  MoreHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainLinks = [
  { href: "/", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/students", label: "الطلاب", icon: Users },
  { href: "/subjects", label: "المواد", icon: BookOpen },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
];

const moreLinks = [
  { href: "/settings", label: "الإعدادات", icon: Settings },
  { href: "/admin/accounts", label: "الحسابات", icon: Shield },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleLogout = async () => {
    setSheetOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  useEffect(() => {
    closeSheet();
  }, [pathname, closeSheet]);

  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sheetOpen]);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-t border-gray-200/60 dark:border-slate-700/60 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around px-2 pt-1.5 pb-1">
            {mainLinks.map(({ href, label, icon: Icon }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all duration-200 min-w-[60px] min-h-[52px] py-1.5",
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-400 dark:text-gray-500 active:text-gray-600 dark:active:text-gray-300"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200",
                    isActive && "bg-blue-50 dark:bg-blue-900/40"
                  )}>
                    <Icon className={cn("h-[22px] w-[22px]", isActive && "stroke-[2.2]")} />
                  </div>
                  <span className="text-[10px] font-semibold leading-none">{label}</span>
                </Link>
              );
            })}

            <button
              onClick={() => setSheetOpen(true)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all duration-200 min-w-[60px] min-h-[52px] py-1.5",
                sheetOpen
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400 dark:text-gray-500 active:text-gray-600 dark:active:text-gray-300"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200",
                sheetOpen && "bg-blue-50 dark:bg-blue-900/40"
              )}>
                <MoreHorizontal className="h-[22px] w-[22px]" />
              </div>
              <span className="text-[10px] font-semibold leading-none">المزيد</span>
            </button>
          </div>
        </div>
      </nav>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeSheet}
          />
          <div className="absolute bottom-0 left-0 right-0 animate-slide-up">
            <div className="bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl pb-[env(safe-area-inset-bottom)]">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-slate-600" />
              </div>

              <div className="px-5 pb-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    المزيد
                  </h3>
                  <button
                    onClick={closeSheet}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  {moreLinks.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-150",
                          isActive
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 flex items-center justify-center rounded-xl",
                          isActive
                            ? "bg-blue-100 dark:bg-blue-800/50"
                            : "bg-gray-100 dark:bg-slate-700"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-sm">{label}</span>
                      </Link>
                    );
                  })}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-500 dark:text-red-400 active:bg-red-50 dark:active:bg-red-900/20 transition-all duration-150"
                  >
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30">
                      <LogOut className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-sm">تسجيل الخروج</span>
                  </button>
                </div>
              </div>

              <div className="h-2" />
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
      `}</style>
    </>
  );
}

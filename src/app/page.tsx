"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  Calendar,
  Percent,
  Activity,
  ClipboardList,
  UserPlus,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";

interface DashboardData {
  totalStudents: number;
  totalSubjects: number;
  totalLectures: number;
  latestLecture: {
    id: number;
    subject: { name: string };
    lectureNumber: number;
    date: string;
  } | null;
  recentActivities: {
    id: number;
    subjectName: string;
    lectureNumber: number;
    date: string;
    isCompleted: boolean;
    presentCount: number;
    absentCount: number;
    totalStudents: number;
  }[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600",
    green: "bg-green-50 dark:bg-green-900/30 text-green-600",
    purple: "bg-purple-50 dark:bg-purple-900/30 text-purple-600",
    orange: "bg-orange-50 dark:bg-orange-900/30 text-orange-600",
  };

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${colorClasses[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <div className="mb-3 h-10 w-10 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-600 dark:bg-slate-600" />
      <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
      <div className="mt-1 h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("فشل تحميل البيانات");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">مرحباً بك في نظام حاضر</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                icon={Users}
                label="إجمالي الطلاب"
                value={data?.totalStudents ?? 0}
                color="blue"
              />
              <StatCard
                icon={BookOpen}
                label="إجمالي المواد"
                value={data?.totalSubjects ?? 0}
                color="green"
              />
              <StatCard
                icon={Calendar}
                label="إجمالي المحاضرات"
                value={data?.totalLectures ?? 0}
                color="purple"
              />
              <StatCard
                icon={Percent}
                label="نسبة الحضور"
                value={`${data?.totalStudents ? Math.round(
                  (data.recentActivities.reduce((s, a) => s + a.presentCount, 0) /
                    Math.max(data.recentActivities.reduce((s, a) => s + a.totalStudents, 0), 1)) *
                  100
                ) : 0}%`}
                color="orange"
              />
            </>
          )}
        </section>

        {loading ? (
          <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-slate-600 dark:bg-slate-600" />
            <div className="mt-4 space-y-3">
              <div className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-700" />
              <div className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-700" />
            </div>
          </div>
        ) : data?.latestLecture ? (
          <section className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              آخر جلسة حضور
            </h2>
            <div className="flex items-center justify-between rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {data.latestLecture.subject.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    المحاضرة {data.latestLecture.lectureNumber} — {formatDate(data.latestLecture.date)}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {!loading && data?.recentActivities && data.recentActivities.length > 0 && (
          <section className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">النشاط الأخيرة</h2>
            <ul className="divide-y divide-gray-100 dark:divide-slate-700">
              {data.recentActivities.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                      <Activity className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.subjectName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        المحاضرة {activity.lectureNumber} —{" "}
                        {activity.presentCount} حاضر / {activity.absentCount} غائب
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDate(activity.date)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!loading && (!data || (data.recentActivities.length === 0 && !data.latestLecture)) && (
          <section className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              لا توجد بيانات بعد
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
              ابدأ بإضافة المواد والمحاضرات لرؤية الإحصائيات
            </p>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">إجراءات سريعة</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/subjects"
              className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">بدء الحضور</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">تسجيل حضور المحاضرة</p>
              </div>
            </Link>

            <Link
              href="/students"
              className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm transition hover:border-green-200 hover:bg-green-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">إدارة الطلاب</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">إضافة وتعديل وحذف</p>
              </div>
            </Link>

            <Link
              href="/reports"
              className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm transition hover:border-purple-200 hover:bg-purple-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">عرض التقارير</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">إحصائيات وتحليلات</p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

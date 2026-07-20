"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Play,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  Trash2,
  ArrowRight,
  Clock,
  UserCheck,
  UserX,
  Sparkles,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { addToast } from "@/components/ui/Toast";

interface LectureData {
  id: number;
  lectureNumber: number;
  date: string;
  isCompleted: boolean;
  createdBy: string | null;
  closedBy: string | null;
  closedAt: string | null;
  expiresAt: string | null;
  presentCount: number;
  absentCount: number;
  guestCount: number;
  pendingCount: number;
  totalStudents: number;
  auditCount: number;
  recentAudit: {
    action: string;
    performedBy: string | null;
    performedAt: string;
  }[];
}

interface SubjectDetail {
  id: number;
  name: string;
  createdAt: string;
  studentsCount: number;
  totalLectures: number;
  completedLectures: number;
  ongoingLectures: number;
  overallPercentage: number;
  totalPresent: number;
  totalAbsent: number;
  totalGuest: number;
  totalPending: number;
  lastLecture: {
    id: number;
    lectureNumber: number;
    date: string;
    isCompleted: boolean;
    createdBy: string | null;
    closedBy: string | null;
    closedAt: string | null;
  } | null;
  lectures: LectureData[];
}

export default function SubjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = Number(params.subjectId);

  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [lectureNumberInput, setLectureNumberInput] = useState("");
  const [showStartModal, setShowStartModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; number: number } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/subjects/${subjectId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubject(data);
    } catch {
      addToast("فشل في تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartLecture = async () => {
    setStarting(true);
    try {
      const sessionId = localStorage.getItem("hadir-session-id") || `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("hadir-session-id", sessionId);

      const body: { subjectId: number; lectureNumber?: number; sessionId: string } = { subjectId, sessionId };
      if (lectureNumberInput.trim()) {
        const num = parseInt(lectureNumberInput.trim(), 10);
        if (!isNaN(num) && num > 0) {
          body.lectureNumber = num;
        }
      }
      const res = await fetch("/api/attendance/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to start lecture");
      }
      const data = await res.json();
      setShowStartModal(false);
      setLectureNumberInput("");
      router.push(`/attendance/${subjectId}/session/${data.lecture.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "فشل في بدء المحاضرة";
      addToast(msg, "error");
      setStarting(false);
    }
  };

  const confirmDeleteLecture = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch(`/api/attendance/lecture/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete lecture");
      addToast("تم حذف المحاضرة بنجاح", "success");
      fetchData();
    } catch {
      addToast("فشل في حذف المحاضرة", "error");
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const getPercentage = (present: number, total: number) =>
    total > 0 ? Math.round((present / total) * 100) : 0;

  const getPercentageColor = (pct: number) => {
    if (pct >= 80) return "success";
    if (pct >= 50) return "warning";
    return "danger";
  };

  const nextLectureNumber = subject
    ? subject.lectures.length > 0
      ? Math.max(...subject.lectures.map((l) => l.lectureNumber)) + 1
      : 1
    : 1;

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton height="2rem" className="w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
                <Skeleton height="1.5rem" className="w-1/2 mb-3" />
                <Skeleton height="1rem" className="w-1/3" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
                <Skeleton height="1.5rem" className="w-1/3 mb-3" />
                <Skeleton height="1rem" className="w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (!subject) {
    return (
      <AppShell>
        <EmptyState
          icon={XCircle}
          title="المادة غير موجودة"
          description="لم يتم العثور على هذه المادة"
          actionLabel="العودة للمواد"
          onAction={() => router.push("/subjects")}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={subject.name}
        description="تفاصيل المادة وسجل المحاضرات"
        backButton
        action={
          <Button
            onClick={() => setShowStartModal(true)}
            icon={<Play className="h-4 w-4" />}
          >
            بدء محاضرة جديدة
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{subject.totalLectures}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">محاضرة</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{subject.studentsCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">طالب</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{subject.overallPercentage}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">نسبة الحضور</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{subject.completedLectures}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">مكتملة</p>
            </div>
          </div>
        </div>
      </div>

      {subject.lectures.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="لا توجد محاضرات بعد"
          description="ابدأ أول محاضرة لهذا المقرر"
          actionLabel="بدء محاضرة"
          onAction={() => setShowStartModal(true)}
        />
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">سجل المحاضرات</h2>
          {subject.lectures.map((lecture) => {
            const pct = getPercentage(lecture.presentCount, lecture.totalStudents);
            return (
              <div
                key={lecture.id}
                onClick={() => {
                  const allMarked = lecture.totalStudents > 0 && lecture.absentCount === 0;
                  router.push(
                    lecture.isCompleted || allMarked
                      ? `/subjects/${subjectId}/lecture/${lecture.id}`
                      : `/attendance/${subjectId}/session/${lecture.id}`
                  );
                }}
                className="group rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-slate-900/50 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        المحاضرة رقم {lecture.lectureNumber}
                      </h3>
                      {lecture.isCompleted ? (
                        <Badge variant="success">مكتملة</Badge>
                      ) : (
                        <Badge variant="warning">جارية</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {new Date(lecture.date).toLocaleDateString("ar-SA", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-4 w-4" />
                        {lecture.presentCount} حاضر
                      </span>
                      <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                        <XCircle className="h-4 w-4" />
                        {lecture.absentCount} غائب
                      </span>
                      {lecture.guestCount > 0 && (
                        <span className="flex items-center gap-1 text-purple-500 dark:text-purple-400">
                          <Sparkles className="h-4 w-4" />
                          {lecture.guestCount} مستاذن
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Users className="h-4 w-4" />
                        {lecture.totalStudents} إجمالي
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Badge variant={getPercentageColor(pct) as "success" | "warning" | "danger"}>
                      <TrendingUp className="h-3 w-3 ms-1" />
                      {pct}%
                    </Badge>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/subjects/${subjectId}/lecture/${lecture.id}`);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-900/30"
                      title="عرض سجل المحاضرة"
                    >
                      <ClipboardList className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({ id: lecture.id, number: lecture.lectureNumber });
                      }}
                      disabled={deletingId === lecture.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 dark:hover:bg-red-900/30"
                      title="حذف المحاضرة"
                    >
                      {deletingId === lecture.id ? (
                        <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showStartModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">بدء محاضرة جديدة</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                رقم المحاضرة
              </label>
              <input
                type="number"
                min="1"
                value={lectureNumberInput}
                onChange={(e) => setLectureNumberInput(e.target.value)}
                placeholder={`${nextLectureNumber} (تلقائي)`}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                الرقم التالي: {nextLectureNumber}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleStartLecture}
                loading={starting}
                icon={<Play className="h-4 w-4" />}
                className="flex-1"
              >
                بدء المحاضرة
              </Button>
              <Button
                onClick={() => {
                  setShowStartModal(false);
                  setLectureNumberInput("");
                }}
                variant="secondary"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteLecture}
        title="حذف المحاضرة"
        message={`هل أنت متأكد من حذف المحاضرة رقم ${deleteTarget?.number}؟\n\nسيتم حذف جميع بيانات الحضور والغياب لهذه المحاضرة نهائياً من قاعدة البيانات.`}
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        variant="danger"
      />
    </AppShell>
  );
}

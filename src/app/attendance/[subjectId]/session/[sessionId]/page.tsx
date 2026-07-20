"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { addToast } from "@/components/ui/Toast";
import { useAttendanceRealtime } from "@/hooks/useAttendanceRealtime";
import { Save, Clock, Sparkles, Lock, AlertTriangle, List } from "lucide-react";

interface Student {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  status: string;
  student: Student;
  lockedBy?: string | null;
  lockedAt?: string | null;
}

interface LectureData {
  id: string;
  lectureNumber: number;
  date: string;
  isCompleted: boolean;
  createdBy?: string | null;
  expiresAt?: string | null;
  subject: {
    id: string;
    name: string;
  };
  attendance: AttendanceRecord[];
}

export default function AttendanceSessionPage({
  params,
}: {
  params: { subjectId: string; sessionId: string };
}) {
  const { subjectId, sessionId: lectureId } = params;
  const router = useRouter();

  const [sessionUserId] = useState(() => {
    if (typeof window === "undefined") return "";
    let id = localStorage.getItem("hadir-session-id");
    if (!id) {
      id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem("hadir-session-id", id);
    }
    return id;
  });

  const [lecture, setLecture] = useState<LectureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showWaitingList, setShowWaitingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  const isCreator = !lecture?.createdBy || lecture?.createdBy === sessionUserId;

  const fetchLecture = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/attendance/lecture/${lectureId}`);
      if (!res.ok) throw new Error("فشل في تحميل بيانات المحاضرة");
      const data: LectureData = await res.json();
      data.attendance.sort((a, b) =>
        a.student.name.localeCompare(b.student.name, "ar")
      );
      setLecture(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }, [lectureId]);

  useEffect(() => {
    fetchLecture();
  }, [fetchLecture]);

  useEffect(() => {
    if (!lecture || lecture.isCompleted) return;
    const poll = setInterval(() => {
      fetch(`/api/attendance/lecture/${lectureId}`)
        .then((r) => r.json())
        .then((data: LectureData) => {
          data.attendance.sort((a, b) =>
            a.student.name.localeCompare(b.student.name, "ar")
          );
          setLecture(data);
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(poll);
  }, [lecture?.isCompleted, lectureId]);

  useEffect(() => {
    if (lecture && lecture.isCompleted) {
      router.replace(`/subjects/${subjectId}/lecture/${lectureId}`);
    }
  }, [lecture, subjectId, lectureId, router]);

  const sorted = useMemo(() => lecture?.attendance ?? [], [lecture?.attendance]);
  const unmarked = useMemo(() => sorted.filter((r) => r.status === "absent"), [sorted]);
  const current = unmarked[currentIndex];
  const totalStudents = unmarked.length;
  const allStudents = sorted.length;
  const markedCount = allStudents - totalStudents;

  const presentCount = sorted.filter((r) => r.status === "present").length;
  const absentCount = sorted.filter((r) => r.status === "absent").length;
  const pendingCount = sorted.filter((r) => r.status === "pending").length;
  const guestCount = sorted.filter((r) => r.status === "guest").length;

  const goToStudent = useCallback(
    (index: number) => {
      if (index >= 0 && index < unmarked.length) {
        setCurrentIndex(index);
      }
    },
    [unmarked.length]
  );

  const submitStatus = useCallback(
    async (attendanceId: string, status: "present" | "absent" | "pending" | "guest") => {
      setSubmitting(attendanceId);
      try {
        const res = await fetch("/api/attendance/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attendanceId, status, sessionId: sessionUserId }),
        });
        if (!res.ok) {
          const err = await res.json();
          if (res.status === 409) {
            addToast(err.error || "تم تسجيل هذا الطالب بالفعل من مستخدم آخر", "info");
            await fetchLecture();
            return;
          }
          throw new Error(err.error || "فشل في تسجيل الحضور");
        }
        await fetchLecture();
        if (currentIndex >= unmarked.length - 1 && unmarked.length > 1) {
          setCurrentIndex(Math.max(0, currentIndex - 1));
        }
      } catch (err) {
        addToast(err instanceof Error ? err.message : "حدث خطأ في التسجيل", "error");
      } finally {
        setSubmitting(null);
      }
    },
    [unmarked, currentIndex, sessionUserId, fetchLecture, addToast]
  );

  const markCurrent = useCallback(
    (status: "present" | "absent" | "pending" | "guest") => {
      if (!current || submitting) return;
      submitStatus(current.id, status);
    },
    [current, submitting, submitStatus]
  );

  const handleComplete = useCallback(async () => {
    if (!isCreator) {
      addToast("يمكن لمن أنشأ المحاضرة فقط إغلاقها", "error");
      return;
    }
    setCompleting(true);
    try {
      const res = await fetch("/api/attendance/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lectureId: Number(lectureId), sessionId: sessionUserId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشل إنهاء المحاضرة");
      }
      setShowComplete(true);
      setShowCompleteConfirm(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "حدث خطأ في إنهاء المحاضرة", "error");
    } finally {
      setCompleting(false);
    }
  }, [lectureId, addToast, isCreator, sessionUserId]);

  const handleFinish = useCallback(() => {
    router.push(`/attendance/${subjectId}`);
  }, [router, subjectId]);

  const handleSaveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/attendance/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lectureId: Number(lectureId),
          sessionId: sessionUserId,
          savedData: { currentIndex },
          studentIndex: currentIndex,
        }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      addToast("تم حفظ العملية بنجاح. يمكنك الاستئناف لاحقاً", "success");
    } catch {
      addToast("فشل في حفظ العملية", "error");
    } finally {
      setSaving(false);
    }
  }, [lectureId, sessionUserId, currentIndex, addToast]);

  useEffect(() => {
    if (loading || !lecture || lecture.isCompleted) return;

    const loadDraft = async () => {
      try {
        const res = await fetch(`/api/attendance/resume-draft?lectureId=${lectureId}&sessionId=${sessionUserId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.draft) {
          const savedData = data.draft.savedData as { currentIndex?: number };
          if (savedData?.currentIndex !== undefined) {
            setCurrentIndex(savedData.currentIndex);
          }
          addToast("تم استرجاع الجلسة المحفوظة مع المزامنة", "info");
        }
      } catch {}
    };
    loadDraft();
  }, [loading, lecture, lectureId, sessionUserId, addToast]);

  useEffect(() => {
    if (!lecture?.expiresAt || lecture.isCompleted) return;

    const updateTimer = () => {
      const now = Date.now();
      const expires = new Date(lecture.expiresAt!).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeRemaining("انتهت المدة");
        setIsExpired(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${hours}س ${minutes}د ${seconds}ث`);
      setIsExpired(false);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lecture?.expiresAt, lecture?.isCompleted]);

  const onAttendanceUpdated = useCallback(
    (update: { id: number; status: string }) => {
      setLecture((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attendance: prev.attendance.map((r) =>
            r.id === String(update.id) ? { ...r, status: update.status } : r
          ),
        };
      });
    },
    []
  );

  const onLectureCompleted = useCallback(() => {
    setShowComplete(true);
    addToast("تم إغلاق المحاضرة من مستخدم آخر", "info");
  }, [addToast]);

  useAttendanceRealtime({
    lectureId: Number(lectureId),
    onAttendanceUpdated,
    onLectureCompleted,
  });

  useEffect(() => {
    if (
      !showComplete &&
      unmarked.length === 0 &&
      allStudents > 0
    ) {
      setShowComplete(true);
    }
  }, [unmarked, allStudents, showComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || showComplete || submitting || lecture?.isCompleted) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToStudent(Math.min(currentIndex + 1, totalStudents - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToStudent(currentIndex - 1);
      } else if (e.key === "p" || e.key === "P") {
        markCurrent("present");
      } else if (e.key === "a" || e.key === "A") {
        markCurrent("absent");
      } else if (e.key === "w" || e.key === "W") {
        markCurrent("pending");
      } else if (e.key === "g" || e.key === "G") {
        markCurrent("guest");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, showComplete, submitting, currentIndex, totalStudents, goToStudent, markCurrent, lecture?.isCompleted]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const isLockedByOther = (record: AttendanceRecord) => {
    if (!record.lockedBy || !record.lockedAt) return false;
    if (record.lockedBy === sessionUserId) return false;
    const elapsed = Date.now() - new Date(record.lockedAt).getTime();
    return elapsed < 30 * 1000;
  };

  const isDisabled = lecture?.isCompleted || isExpired;

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton height="2rem" className="w-48" />
          <Skeleton height="1rem" className="w-32" />
          <Skeleton height="1rem" className="w-40" />
          <Skeleton height="0.75rem" className="w-full" />
          <div className="mt-8">
            <Skeleton height="2rem" className="w-64 mx-auto" />
          </div>
          <div className="flex gap-4 mt-8">
            <Skeleton height="4rem" className="flex-1" />
            <Skeleton height="4rem" className="flex-1" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{error}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            حدث خطأ أثناء تحميل بيانات المحاضرة
          </p>
          <Button onClick={fetchLecture} variant="primary" size="lg">
            إعادة المحاولة
          </Button>
        </Card>
      </AppShell>
    );
  }

  if (!lecture) {
    return (
      <AppShell>
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            لا توجد بيانات
          </h2>
          <Button onClick={handleFinish} variant="primary" size="lg">
            العودة
          </Button>
        </Card>
      </AppShell>
    );
  }

  if (showComplete) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
          <div className="w-28 h-28 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-8 animate-bounce">
            <span className="text-6xl">✓</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            تم تسجيل الحضور
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
            {lecture.subject.name} — المحاضرة رقم {lecture.lectureNumber}
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-10">
            <Card className="flex flex-col items-center px-6 py-4">
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">{presentCount}</span>
              <span className="text-green-600 dark:text-green-400 font-medium mt-1">الحضور</span>
            </Card>
            <Card className="flex flex-col items-center px-6 py-4">
              <span className="text-3xl font-bold text-red-600 dark:text-red-400">{absentCount}</span>
              <span className="text-red-600 dark:text-red-400 font-medium mt-1">الغياب</span>
            </Card>
            {guestCount > 0 && (
              <Card className="flex flex-col items-center px-6 py-4">
                <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">{guestCount}</span>
                <span className="text-purple-600 dark:text-purple-400 font-medium mt-1">المستأذنين</span>
              </Card>
            )}
            {pendingCount > 0 && (
              <Card className="flex flex-col items-center px-6 py-4">
                <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium mt-1">انتظار</span>
              </Card>
            )}
          </div>
          <Button onClick={handleFinish} variant="primary" size="lg" className="px-12">
            إنهاء المحاضرة
          </Button>
        </div>
      </AppShell>
    );
  }

  const progress = allStudents > 0 ? (markedCount / allStudents) * 100 : 0;

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleFinish}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            <span className="text-lg">→</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
              {lecture.subject.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              المحاضرة رقم {lecture.lectureNumber} — {formatDate(lecture.date)}
            </p>
          </div>
          <button
            onClick={() => router.push(`/subjects/${subjectId}/lecture/${lectureId}`)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">سجل المحاضرة</span>
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>حفظ</span>
          </button>
        </div>

        {timeRemaining && !lecture.isCompleted && (
          <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
            isExpired
              ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          }`}>
            <Clock className="h-4 w-4" />
            <span>{isExpired ? "انتهت مدة المحاضرة" : `متبقي: ${timeRemaining}`}</span>
          </div>
        )}

        {lecture.isCompleted && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-medium">
            <Lock className="h-4 w-4" />
            <span>تم إغلاق المحاضرة</span>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              {totalStudents > 0 ? `الطالب ${currentIndex + 1} من ${totalStudents}` : "تم تسجيل جميع الطلاب"}
            </span>
            <span className="text-gray-400 dark:text-gray-500">
              {markedCount} تم تسجيلهم
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {!lecture.isCompleted && current && (
          <Card className={`flex flex-col items-center py-6 sm:py-10 transition-all duration-300 ${
            isLockedByOther(current) ? "ring-2 ring-amber-400 dark:ring-amber-600" : ""
          }`}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mb-4 sm:mb-6">
              <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                {currentIndex + 1}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center transition-all duration-300 px-4 break-words">
              {current.student.name}
            </h2>
            {isLockedByOther(current) && (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs mt-1">
                <Lock className="h-3 w-3" />
                <span>قيد التعديل من مستخدم آخر</span>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full mt-6 sm:mt-8 px-2">
              <button
                onClick={() => markCurrent("present")}
                disabled={submitting === current.id || isDisabled || isLockedByOther(current)}
                className="min-h-[50px] sm:min-h-[60px] rounded-xl bg-green-500 text-white text-xs sm:text-sm font-bold
                  hover:bg-green-600 active:bg-green-700 transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
                  focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
                  flex items-center justify-center gap-1 sm:gap-2 cursor-pointer select-none"
              >
                <span className="text-base sm:text-xl">✓</span>
                حاضر
              </button>
              <button
                onClick={() => markCurrent("absent")}
                disabled={submitting === current.id || isDisabled || isLockedByOther(current)}
                className="min-h-[50px] sm:min-h-[60px] rounded-xl bg-red-500 text-white text-xs sm:text-sm font-bold
                  hover:bg-red-600 active:bg-red-700 transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
                  focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2
                  flex items-center justify-center gap-1 sm:gap-2 cursor-pointer select-none"
              >
                <span className="text-base sm:text-xl">✗</span>
                غائب
              </button>
              <button
                onClick={() => markCurrent("pending")}
                disabled={submitting === current.id || isDisabled || isLockedByOther(current)}
                className="min-h-[50px] sm:min-h-[60px] rounded-xl bg-amber-500 text-white text-xs sm:text-sm font-bold
                  hover:bg-amber-600 active:bg-amber-700 transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
                  focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2
                  flex items-center justify-center gap-1 sm:gap-2 cursor-pointer select-none"
              >
                <span className="text-base sm:text-xl">⏳</span>
                انتظار
              </button>
              <button
                onClick={() => markCurrent("guest")}
                disabled={submitting === current.id || isDisabled || isLockedByOther(current)}
                className="min-h-[50px] sm:min-h-[60px] rounded-xl bg-purple-500 text-white text-xs sm:text-sm font-bold
                  hover:bg-purple-600 active:bg-purple-700 transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
                  focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2
                  flex items-center justify-center gap-1 sm:gap-2 cursor-pointer select-none"
              >
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                مستاذن
              </button>
            </div>
          </Card>
        )}

        {lecture.isCompleted && (
          <Card className="flex flex-col items-center py-10">
            <Lock className="h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">المحاضرة مكتملة ومغلقة</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">لا يمكن التعديل بعد الإغلاق</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="text-center">
                <span className="text-2xl font-bold text-green-600">{presentCount}</span>
                <p className="text-xs text-green-600">حاضر</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-red-500">{absentCount}</span>
                <p className="text-xs text-red-500">غائب</p>
              </div>
              {guestCount > 0 && (
                <div className="text-center">
                  <span className="text-2xl font-bold text-purple-600">{guestCount}</span>
                  <p className="text-xs text-purple-600">مستاذن</p>
                </div>
              )}
            </div>
            <button
              onClick={() => router.push(`/subjects/${subjectId}/lecture/${lectureId}`)}
              className="mt-6 px-4 py-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-200 transition-colors cursor-pointer"
            >
              عرض سجل التدقيق
            </button>
          </Card>
        )}

        <div className="flex items-center justify-between gap-1 sm:gap-3">
          <button
            onClick={() => goToStudent(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="px-1.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            ← السابق
          </button>

          <div className="flex-1 overflow-hidden">
            <div className="flex gap-[2px] justify-center">
              {unmarked.map((record, i) => {
                const dist = Math.abs(i - currentIndex);
                if (dist > 5) return null;
                return (
                  <button
                    key={record.id}
                    onClick={() => goToStudent(i)}
                    className={`rounded-full transition-all duration-200 cursor-pointer shrink-0 ${
                      i === currentIndex
                        ? "w-4 h-1.5 sm:w-5 sm:h-2 bg-blue-600"
                        : "w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-300 dark:bg-slate-600 hover:scale-125"
                    }`}
                    aria-label={`الطالب ${i + 1}`}
                  />
                );
              })}
            </div>
            <p className="text-center text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              {totalStudents > 0 ? `${currentIndex + 1} / ${totalStudents}` : "✓ جميع الطلاب تم تسجيلهم"}
            </p>
          </div>

          <button
            onClick={() => goToStudent(currentIndex + 1)}
            disabled={currentIndex === totalStudents - 1}
            className="px-1.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            التالي →
          </button>
        </div>

        {unmarked.length === 0 &&
          sorted.length > 0 && (
            <div className="pt-4 space-y-4">
              {sorted.filter((r) => r.status === "pending").length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300">
                      قائمة الانتظار ({sorted.filter((r) => r.status === "pending").length} طالب)
                    </h3>
                    <button
                      onClick={() => setShowWaitingList(!showWaitingList)}
                      className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 text-sm font-medium cursor-pointer"
                    >
                      {showWaitingList ? "إخفاء" : "عرض"}
                    </button>
                  </div>
                  {showWaitingList && (
                    <div className="space-y-2">
                      {sorted
                        .filter((r) => r.status === "pending")
                        .map((record) => (
                          <div
                            key={record.id}
                            className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3 border border-amber-100 dark:border-amber-900/30"
                          >
                            <span className="font-medium text-gray-900 dark:text-white">
                              {record.student.name}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => submitStatus(record.id, "present")}
                                disabled={submitting === record.id || isDisabled}
                                className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-lg
                                  hover:bg-green-600 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                ✓ حاضر
                              </button>
                              <button
                                onClick={() => submitStatus(record.id, "absent")}
                                disabled={submitting === record.id || isDisabled}
                                className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-lg
                                  hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                ✗ غائب
                              </button>
                              <button
                                onClick={() => submitStatus(record.id, "guest")}
                                disabled={submitting === record.id || isDisabled}
                                className="px-3 py-1 bg-purple-500 text-white text-sm font-medium rounded-lg
                                  hover:bg-purple-600 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                ★ مستاذن
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {!lecture.isCompleted && (
                <>
                  {isCreator ? (
                    <Button
                      onClick={() => setShowCompleteConfirm(true)}
                      variant="primary"
                      size="lg"
                      className="w-full"
                    >
                      إنهاء المحاضرة
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>يمكن لمن أنشأ المحاضرة فقط إغلاقها</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        {showCompleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">إنهاء المحاضرة</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                هل أنت متأكد من إنهاء المحاضرة؟ لن تتمكن من تسجيل الحضور بعد الإغلاق.
              </p>
              <div className="flex gap-3">
                <Button onClick={handleComplete} loading={completing} className="flex-1">
                  نعم، إنهاء
                </Button>
                <Button onClick={() => setShowCompleteConfirm(false)} variant="secondary">
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

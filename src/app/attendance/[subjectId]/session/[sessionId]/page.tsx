"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { addToast } from "@/components/ui/Toast";

interface Student {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  status: string;
  student: Student;
}

interface LectureData {
  id: string;
  lectureNumber: number;
  date: string;
  isCompleted: boolean;
  subject: {
    id: string;
    name: string;
  };
  attendance: AttendanceRecord[];
}

type StudentStatus = "present" | "absent" | "pending" | null;

interface StudentStatusMap {
  [attendanceId: string]: StudentStatus;
}

export default function AttendanceSessionPage({
  params,
}: {
  params: { subjectId: string; sessionId: string };
}) {
  const { subjectId, sessionId } = params;
  const router = useRouter();

  const [lecture, setLecture] = useState<LectureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statuses, setStatuses] = useState<StudentStatusMap>({});
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showWaitingList, setShowWaitingList] = useState(false);

  const fetchLecture = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/attendance/lecture/${sessionId}`);
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
  }, [sessionId]);

  useEffect(() => {
    fetchLecture();
  }, [fetchLecture]);

  const sorted = lecture?.attendance ?? [];
  const current = sorted[currentIndex];
  const totalStudents = sorted.length;
  const visitedCount = visited.size;

  const presentCount = Object.values(statuses).filter(
    (s) => s === "present"
  ).length;
  const absentCount = Object.values(statuses).filter(
    (s) => s === "absent"
  ).length;
  const pendingCount = Object.values(statuses).filter(
    (s) => s === "pending"
  ).length;

  const goToStudent = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalStudents) {
        setCurrentIndex(index);
      }
    },
    [totalStudents]
  );

  const submitStatus = useCallback(
    async (attendanceId: string, status: "present" | "absent" | "pending") => {
      setSubmitting(attendanceId);
      setStatuses((prev) => ({ ...prev, [attendanceId]: status }));
      setVisited((prev) => new Set(prev));
      try {
        const res = await fetch("/api/attendance/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attendanceId, status }),
        });
        if (!res.ok) throw new Error("فشل في تسجيل الحضور");
        setVisited((prev) => {
          const next = new Set(prev);
          const idx = sorted.findIndex((r) => r.id === attendanceId);
          if (idx !== -1) next.add(idx);
          return next;
        });
        const idx = sorted.findIndex((r) => r.id === attendanceId);
        if (idx !== -1 && idx < totalStudents - 1) {
          setCurrentIndex(idx + 1);
        }
      } catch (err) {
        addToast(
          err instanceof Error ? err.message : "حدث خطأ في التسجيل",
          "error"
        );
        setStatuses((prev) => {
          const next = { ...prev };
          delete next[attendanceId];
          return next;
        });
      } finally {
        setSubmitting(null);
      }
    },
    [sorted, totalStudents, addToast]
  );

  const markCurrent = useCallback(
    (status: "present" | "absent" | "pending") => {
      if (!current || submitting) return;
      submitStatus(current.id, status);
    },
    [current, submitting, submitStatus]
  );

  const handleComplete = useCallback(async () => {
    setCompleting(true);
    try {
      const res = await fetch("/api/attendance/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lectureId: sessionId }),
      });
      if (!res.ok) throw new Error("فشل إنهاء المحاضرة");
      setShowComplete(true);
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "حدث خطأ في إنهاء المحاضرة",
        "error"
      );
    } finally {
      setCompleting(false);
    }
  }, [sessionId, addToast]);

  const handleFinish = useCallback(() => {
    router.push(`/attendance/${subjectId}`);
  }, [router, subjectId]);

  useEffect(() => {
    if (
      !showComplete &&
      totalStudents > 0 &&
      visited.size === totalStudents &&
      sorted.every((r) => statuses[r.id] !== undefined) &&
      pendingCount === 0
    ) {
      setShowComplete(true);
    }
  }, [visited, totalStudents, statuses, sorted, showComplete, pendingCount]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || showComplete || submitting) return;
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
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    loading,
    showComplete,
    submitting,
    currentIndex,
    totalStudents,
    goToStudent,
    markCurrent,
  ]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

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
          <div className="flex gap-6 mb-10">
            <Card className="flex flex-col items-center px-8 py-4">
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                {presentCount}
              </span>
              <span className="text-green-600 dark:text-green-400 font-medium mt-1">الحضور</span>
            </Card>
            <Card className="flex flex-col items-center px-8 py-4">
              <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                {absentCount}
              </span>
              <span className="text-red-600 dark:text-red-400 font-medium mt-1">الغياب</span>
            </Card>
            {pendingCount > 0 && (
              <Card className="flex flex-col items-center px-8 py-4">
                <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {pendingCount}
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-medium mt-1">انتظار</span>
              </Card>
            )}
          </div>
          <Button
            onClick={handleFinish}
            variant="primary"
            size="lg"
            className="px-12"
          >
            إنهاء المحاضرة
          </Button>
        </div>
      </AppShell>
    );
  }

  const progress = totalStudents > 0 ? (visitedCount / totalStudents) * 100 : 0;

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
            <p className="text-sm sm:text-gray-600 dark:text-gray-400 text-gray-500 dark:text-gray-400">
              المحاضرة رقم {lecture.lectureNumber}
            </p>
                <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
              {formatDate(lecture.date)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              الطالب {currentIndex + 1} من {totalStudents}
            </span>
            <span className="text-gray-400 dark:text-gray-500">
              {visitedCount} تم تسجيلهم
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {current && (
          <Card className="flex flex-col items-center py-6 sm:py-10 transition-all duration-300">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mb-4 sm:mb-6">
              <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                {currentIndex + 1}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center transition-all duration-300 px-4 break-words">
              {current.student.name}
            </h2>
            {statuses[current.id] && (
              <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
            <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                  {statuses[current.id] === "present" ? "✓ تم التسجيل: حاضر" : statuses[current.id] === "pending" ? "⏳ تم التسجيل: انتظار" : "✗ تم التسجيل: غائب"}
                </p>
                <button
                  onClick={() => {
                    const nextStatus = statuses[current.id] === "present" ? "absent" : statuses[current.id] === "absent" ? "pending" : "present";
                    submitStatus(current.id, nextStatus);
                  }}
                  disabled={submitting === current.id}
                  className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer disabled:opacity-50"
                >
                  تعديل
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full mt-6 sm:mt-8 px-2">
              <button
                onClick={() => markCurrent("present")}
                disabled={submitting === current.id}
                className="min-h-[56px] sm:min-h-[60px] rounded-xl bg-green-500 text-white text-sm sm:text-lg font-bold
                  hover:bg-green-600 active:bg-green-700 transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
                  focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
                  flex items-center justify-center gap-1 sm:gap-2 cursor-pointer select-none"
              >
                <span className="text-lg sm:text-xl">✓</span>
                حاضر
              </button>
              <button
                onClick={() => markCurrent("pending")}
                disabled={submitting === current.id}
                className="min-h-[56px] sm:min-h-[60px] rounded-xl bg-amber-500 text-white text-sm sm:text-lg font-bold
                  hover:bg-amber-600 active:bg-amber-700 transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
                  focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2
                  flex items-center justify-center gap-1 sm:gap-2 cursor-pointer select-none"
              >
                <span className="text-lg sm:text-xl">⏳</span>
                انتظار
              </button>
              <button
                onClick={() => markCurrent("absent")}
                disabled={submitting === current.id}
                className="min-h-[56px] sm:min-h-[60px] rounded-xl bg-red-500 text-white text-sm sm:text-lg font-bold
                  hover:bg-red-600 active:bg-red-700 transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
                  focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2
                  flex items-center justify-center gap-1 sm:gap-2 cursor-pointer select-none"
              >
                <span className="text-lg sm:text-xl">✗</span>
                غائب
              </button>
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <Button
            onClick={() => goToStudent(currentIndex - 1)}
            disabled={currentIndex === 0}
            variant="ghost"
            size="lg"
            className="flex-1 text-sm sm:text-base"
          >
            السابق ←
          </Button>

          <div className="flex gap-1 overflow-x-auto max-w-[140px] sm:max-w-none justify-center py-1">
            {sorted.map((_, i) => (
              <button
                key={i}
                onClick={() => goToStudent(i)}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-200 cursor-pointer shrink-0 ${
                  i === currentIndex
                    ? "bg-blue-600 scale-125"
                    : visited.has(i)
                    ? statuses[sorted[i].id] === "present"
                      ? "bg-green-400"
                      : statuses[sorted[i].id] === "pending"
                      ? "bg-amber-400"
                      : "bg-red-400"
                    : "bg-gray-300 dark:bg-slate-600"
                }`}
                aria-label={`الطالب ${i + 1}`}
              />
            ))}
          </div>

          <Button
            onClick={() => goToStudent(currentIndex + 1)}
            disabled={currentIndex === totalStudents - 1}
            variant="ghost"
            size="lg"
            className="flex-1 text-sm sm:text-base"
          >
            → التالي
          </Button>
        </div>

        {visited.size === totalStudents &&
          sorted.every((r) => statuses[r.id] !== undefined) && (
            <div className="pt-4 space-y-4">
              {pendingCount > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300">
                      قائمة الانتظار ({pendingCount} طالب)
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
                        .filter((r) => statuses[r.id] === "pending")
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
                                disabled={submitting === record.id}
                                className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-lg
                                  hover:bg-green-600 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                ✓ حاضر
                              </button>
                              <button
                                onClick={() => submitStatus(record.id, "absent")}
                                disabled={submitting === record.id}
                                className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-lg
                                  hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                ✗ غائب
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
              <Button
                onClick={handleComplete}
                loading={completing}
                variant="primary"
                size="lg"
                className="w-full"
              >
                إنهاء المحاضرة
              </Button>
            </div>
          )}
      </div>
    </AppShell>
  );
}

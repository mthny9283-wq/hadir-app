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
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { addToast } from "@/components/ui/Toast";

interface LectureHistory {
  id: number;
  lectureNumber: number;
  date: string;
  isCompleted: boolean;
  presentCount: number;
  absentCount: number;
  totalStudents: number;
}

export default function SubjectAttendancePage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = Number(params.subjectId);

  const [subjectName, setSubjectName] = useState("");
  const [lectures, setLectures] = useState<LectureHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [lectureNumberInput, setLectureNumberInput] = useState("");
  const [showStartModal, setShowStartModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; number: number } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [subjectRes, historyRes] = await Promise.all([
        fetch(`/api/subjects/${subjectId}`),
        fetch(`/api/attendance/history?subjectId=${subjectId}`),
      ]);

      if (!subjectRes.ok || !historyRes.ok)
        throw new Error("Failed to fetch");

      const subjectData = await subjectRes.json();
      const historyData = await historyRes.json();

      setSubjectName(subjectData.name);
      setLectures(historyData);
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
      const body: { subjectId: number; lectureNumber?: number } = { subjectId };
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

  const getPercentage = (present: number, total: number) =>
    total > 0 ? Math.round((present / total) * 100) : 0;

  const getPercentageColor = (pct: number) => {
    if (pct >= 80) return "success";
    if (pct >= 50) return "warning";
    return "danger";
  };

  const handleDeleteLecture = (lectureId: number, lectureNumber: number) => {
    setDeleteTarget({ id: lectureId, number: lectureNumber });
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

  return (
    <AppShell>
      <PageHeader
        title={loading ? "جاري التحميل..." : subjectName}
        description="سجل الحضور والغياب"
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

      {showStartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">بدء محاضرة جديدة</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم المحاضرة (اختياري)
              </label>
              <input
                type="number"
                min="1"
                value={lectureNumberInput}
                onChange={(e) => setLectureNumberInput(e.target.value)}
                placeholder="اتركه فارغاً للحساب التلقائي"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                إذا لم تدخل رقم، سيتم حسابه تلقائياً
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

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton height="1.5rem" className="w-1/3 mb-3" />
              <Skeleton height="1rem" className="w-2/3 mb-2" />
              <Skeleton height="1rem" className="w-1/2" />
            </Card>
          ))}
        </div>
      ) : lectures.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="لا توجد محاضرات بعد"
          description="ابدأ أول محاضرة لهذا المقرر"
          actionLabel="بدء محاضرة"
          onAction={() => setShowStartModal(true)}
        />
      ) : (
        <div className="space-y-3">
          {lectures.map((lecture) => {
            const pct = getPercentage(
              lecture.presentCount,
              lecture.totalStudents
            );
            return (
              <Card
                key={lecture.id}
                hover
                onClick={() =>
                  router.push(
                    `/attendance/${subjectId}/session/${lecture.id}`
                  )
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        المحاضرة رقم {lecture.lectureNumber}
                      </h3>
                      {lecture.isCompleted && (
                        <Badge variant="success">مكتملة</Badge>
                      )}
                      {!lecture.isCompleted && (
                        <Badge variant="warning">جارية</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      {new Date(lecture.date).toLocaleDateString("ar-SA", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle className="h-4 w-4" />
                        {lecture.presentCount} حاضر
                      </span>
                      <span className="flex items-center gap-1 text-red-500">
                        <XCircle className="h-4 w-4" />
                        {lecture.absentCount} غائب
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Users className="h-4 w-4" />
                        {lecture.totalStudents} إجمالي
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant={getPercentageColor(pct) as "success" | "warning" | "danger"}>
                      <TrendingUp className="h-3 w-3 ms-1" />
                      {pct}%
                    </Badge>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLecture(lecture.id, lecture.lectureNumber);
                      }}
                      disabled={deletingId === lecture.id}
                      className="mt-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
              </Card>
            );
          })}
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

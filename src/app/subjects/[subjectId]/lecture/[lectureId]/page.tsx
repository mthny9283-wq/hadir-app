"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  Clock,
  History,
  ArrowRight,
  Save,
  Sparkles,
  AlertCircle,
  Play,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
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

interface AuditEntry {
  id: number;
  action: string;
  oldStatus: string | null;
  newStatus: string | null;
  performedBy: string | null;
  performedAt: string;
  studentName: string | null;
}

interface LectureInfo {
  id: number;
  createdBy: string | null;
  closedBy: string | null;
  closedAt: string | null;
  createdAt: string;
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

type StatusType = "present" | "absent" | "pending" | "guest";

export default function LectureReviewPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = Number(params.subjectId);
  const lectureId = Number(params.lectureId);

  const [lecture, setLecture] = useState<LectureData | null>(null);
  const [auditInfo, setAuditInfo] = useState<LectureInfo | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [lectureRes, auditRes] = await Promise.all([
        fetch(`/api/attendance/lecture/${lectureId}`),
        fetch(`/api/attendance/audit?lectureId=${lectureId}`),
      ]);

      if (!lectureRes.ok) throw new Error("Failed to fetch lecture");
      const lectureData = await lectureRes.json();
      lectureData.attendance.sort((a: AttendanceRecord, b: AttendanceRecord) =>
        a.student.name.localeCompare(b.student.name, "ar")
      );
      setLecture(lectureData);

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditInfo(auditData.lecture);
        setAuditLogs(auditData.auditLogs);
      }
    } catch {
      addToast("فشل في تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  }, [lectureId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (attendanceId: string, newStatus: StatusType) => {
    setSaving(attendanceId);
    try {
      const sessionId = localStorage.getItem("hadir-session-id") || `session-${Date.now()}`;
      const res = await fetch("/api/attendance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId: Number(attendanceId), status: newStatus, sessionId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      addToast("تم تحديث الحالة بنجاح", "success");
      setEditingId(null);
      fetchData();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "حدث خطأ", "error");
    } finally {
      setSaving(null);
    }
  };

  const sorted = lecture?.attendance ?? [];
  const filtered = sorted.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search && !r.student.name.includes(search)) return false;
    return true;
  });

  const presentCount = sorted.filter((r) => r.status === "present").length;
  const absentCount = sorted.filter((r) => r.status === "absent").length;
  const guestCount = sorted.filter((r) => r.status === "guest").length;
  const pendingCount = sorted.filter((r) => r.status === "pending").length;
  const totalStudents = sorted.length;
  const pct = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge variant="success">حاضر</Badge>;
      case "absent":
        return <Badge variant="danger">غائب</Badge>;
      case "guest":
        return <Badge variant="info">مستاذن</Badge>;
      case "pending":
        return <Badge variant="warning">انتظار</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "status_change": return "تغيير حالة";
      case "complete": return "إغلاق المحاضرة";
      case "lock": return "قفل";
      case "unlock": return "فك القفل";
      default: return action;
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton height="2rem" className="w-48" />
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
                <Skeleton height="1.5rem" className="w-1/2 mb-2" />
                <Skeleton height="1rem" className="w-1/3" />
              </div>
            ))}
          </div>
          <Skeleton height="20rem" className="w-full rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  if (!lecture) {
    return (
      <AppShell>
        <EmptyState
          icon={AlertCircle}
          title="المحاضرة غير موجودة"
          actionLabel="العودة"
          onAction={() => router.push(`/subjects/${subjectId}`)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={`المحاضرة رقم ${lecture.lectureNumber}`}
        description={`${lecture.subject.name} — ${new Date(lecture.date).toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
        backButton
      />

      {!lecture.isCompleted && (
        <div className="mb-6">
          <button
            onClick={() => router.push(`/attendance/${subjectId}/session/${lecture.id}`)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            <Play className="h-4 w-4" />
            دخول وضع التحضير
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{presentCount}</p>
              <p className="text-xs text-gray-500">حاضر</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{absentCount}</p>
              <p className="text-xs text-gray-500">غائب</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{guestCount}</p>
              <p className="text-xs text-gray-500">مستاذن</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{pct}%</p>
              <p className="text-xs text-gray-500">نسبة الحضور</p>
            </div>
          </div>
        </div>
      </div>

      {auditInfo && (
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                الإنشاء: {auditInfo.createdBy ? auditInfo.createdBy.slice(0, 12) + "..." : "غير معروف"}
              </span>
              {auditInfo.closedBy && (
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  الإغلاق: {auditInfo.closedBy.slice(0, 12)}...
                </span>
              )}
              {auditInfo.closedAt && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  أُغلق: {new Date(auditInfo.closedAt).toLocaleString("ar-SA")}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <History className="h-4 w-4" />
                {auditLogs.length} عملية مسجلة
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAudit(!showAudit)}
              icon={<History className="h-3.5 w-3.5" />}
            >
              {showAudit ? "إخفاء" : "السجل"}
            </Button>
          </div>
        </div>
      )}

      {showAudit && (
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">سجل التدقيق</h3>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">لا توجد عمليات مسجلة</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white">
                      <span className="font-medium">{getActionLabel(log.action)}</span>
                      {log.studentName && <span> — الطالب: {log.studentName}</span>}
                      {log.oldStatus && log.newStatus && (
                        <span> من <Badge>{log.oldStatus}</Badge> إلى <Badge>{log.newStatus}</Badge></span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(log.performedAt).toLocaleString("ar-SA")}
                      {log.performedBy && ` — ${log.performedBy.slice(0, 12)}...`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          {["all", "present", "absent", "guest", "pending"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600"
              }`}
            >
              {f === "all" ? "الكل" : f === "present" ? "حاضر" : f === "absent" ? "غائب" : f === "guest" ? "مستاذن" : "انتظار"}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="بحث عن طالب..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 dark:bg-slate-700/50 text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700">
          <div className="col-span-1">#</div>
          <div className="col-span-5">اسم الطالب</div>
          <div className="col-span-3">الحالة</div>
          <div className="col-span-3 text-center">الإجراء</div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-slate-700">
          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
              لا توجد نتائج
            </div>
          ) : (
            filtered.map((record, index) => (
              <div
                key={record.id}
                className={`grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-3 items-center transition-colors ${
                  editingId === record.id ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-slate-700/30"
                }`}
              >
                <div className="col-span-1 text-sm text-gray-400 hidden sm:block">{index + 1}</div>
                <div className="col-span-5 font-medium text-gray-900 dark:text-white text-sm">
                  <span className="sm:hidden text-xs text-gray-400 mr-2">#{index + 1}</span>
                  {record.student.name}
                </div>
                <div className="col-span-3">
                  {editingId === record.id ? (
                    <div className="flex gap-1.5 flex-wrap">
                      {(["present", "absent", "guest", "pending"] as StatusType[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(record.id, s)}
                          disabled={saving === record.id}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                            record.status === s
                              ? "ring-2 ring-blue-500 "
                              : ""
                          } ${
                            s === "present" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" :
                            s === "absent" ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" :
                            s === "guest" ? "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400" :
                            "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {s === "present" ? "حاضر" : s === "absent" ? "غائب" : s === "guest" ? "مستاذن" : "انتظار"}
                        </button>
                      ))}
                    </div>
                  ) : (
                    getStatusBadge(record.status)
                  )}
                </div>
                <div className="col-span-3 flex justify-center">
                  {editingId === record.id ? (
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer"
                    >
                      إلغاء
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingId(record.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer underline"
                    >
                      تعديل
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}

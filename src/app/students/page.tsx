"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Check,
  X,
  Users,
  Trash,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { addToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface Student {
  id: number;
  name: string;
  _count: { attendance: number };
}

function StudentSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-slate-600" />
          <div>
            <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
            <div className="mt-1 h-3 w-20 animate-pulse rounded bg-gray-100 dark:bg-slate-700" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-600" />
          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-600" />
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/students");
      if (!res.ok) throw new Error("فشل تحميل الطلاب");
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "حدث خطأ", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filtered = students
    .filter((s) => s.name.includes(debouncedQuery))
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشل إضافة الطالب");
      }
      setNewName("");
      setAdding(false);
      addToast("تمت إضافة الطالب بنجاح", "success");
      await fetchStudents();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "حدث خطأ", "error");
    }
  };

  const handleEdit = async (id: number) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) throw new Error("فشل تعديل الطالب");
      setEditingId(null);
      setEditName("");
      addToast("تم تعديل الطالب بنجاح", "success");
      await fetchStudents();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "حدث خطأ", "error");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل حذف الطالب");
      setDeletingId(null);
      addToast("تم حذف الطالب بنجاح", "success");
      await fetchStudents();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "حدث خطأ", "error");
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const res = await fetch("/api/students/all", { method: "DELETE" });
      if (!res.ok) throw new Error("فشل حذف الطلاب");
      const data = await res.json();
      setShowDeleteAll(false);
      addToast(`تم حذف ${data.deletedStudents} طالب بنجاح`, "success");
      await fetchStudents();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "حدث خطأ", "error");
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الطلاب</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{students.length} طالب مسجل</p>
          </div>
          <div className="flex gap-2">
            {students.length > 0 && (
              <button
                onClick={() => setShowDeleteAll(true)}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                <Trash className="h-4 w-4" />
                <span className="hidden sm:inline">حذف الكل</span>
              </button>
            )}
            <Link
              href="/students/import"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">استيراد جماعي</span>
            </Link>
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              إضافة طالب
            </button>
          </div>
        </header>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="بحث عن طالب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pr-10 pl-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500"
          />
        </div>

        {adding && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:bg-blue-900/30">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              اسم الطالب الجديد
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="أدخل اسم الطالب"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
              <button
                onClick={handleAdd}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                <Check className="h-4 w-4" />
                حفظ
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setNewName("");
                }}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <StudentSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center dark:border-slate-600 dark:bg-slate-900">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {debouncedQuery ? "لا توجد نتائج" : "لا يوجد طلاب بعد"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {debouncedQuery
                ? "جرّب كلمة بحث مختلفة"
                : "ابدأ بإضافة طلاب أو استيرادهم جماعياً"}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((student) => (
              <li
                key={student.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                {editingId === student.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEdit(student.id);
                        if (e.key === "Escape") {
                          setEditingId(null);
                          setEditName("");
                        }
                      }}
                      className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    />
                    <button
                      onClick={() => handleEdit(student.id)}
                      className="rounded-xl bg-green-600 px-3 py-2.5 text-white transition hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditName("");
                      }}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-600 transition hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600 dark:bg-blue-900/30">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {student.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {student._count.attendance} حضور
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(student.id);
                          setEditName(student.name);
                        }}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-blue-600 dark:text-gray-500 dark:hover:bg-slate-700 dark:hover:text-blue-400"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(student.id)}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId !== null && handleDelete(deletingId)}
        title="حذف الطالب"
        message="هل أنت متأكد من حذف هذا الطالب؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={showDeleteAll}
        onClose={() => setShowDeleteAll(false)}
        onConfirm={handleDeleteAll}
        title="حذف جميع الطلاب"
        message={`هل أنت متأكد من حذف جميع الطلاب (${students.length} طالب) والحضور المرتبط بهم؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel={deletingAll ? "جاري الحذف..." : "حذف الكل"}
        cancelLabel="إلغاء"
        variant="danger"
      />
    </AppShell>
  );
}

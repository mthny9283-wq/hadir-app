"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  BookOpen,
  X,
  Check,
  Calendar,
  Users,
  TrendingUp,
  GraduationCap,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { addToast } from "@/components/ui/Toast";

interface SubjectData {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: { lectures: number };
}

const subjectColors = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-purple-500 to-purple-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-cyan-500 to-cyan-600",
  "from-indigo-500 to-indigo-600",
  "from-teal-500 to-teal-600",
];

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchSubjects = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/subjects?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubjects(data);
    } catch {
      addToast("فشل في تحميل المواد", "error");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(fetchSubjects, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchSubjects, search]);

  const handleCreate = async () => {
    if (!newSubjectName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSubjectName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create");
      addToast("تمت إضافة المادة بنجاح", "success");
      setNewSubjectName("");
      setShowAddModal(false);
      fetchSubjects();
    } catch {
      addToast("فشل في إضافة المادة", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) return;
    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update");
      addToast("تم تحديث المادة بنجاح", "success");
      setEditingId(null);
      setEditingName("");
      fetchSubjects();
    } catch {
      addToast("فشل في تحديث المادة", "error");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      addToast("تم حذف المادة بنجاح", "success");
      fetchSubjects();
    } catch {
      addToast("فشل في حذف المادة", "error");
    }
  };

  const getColor = (index: number) => subjectColors[index % subjectColors.length];

  const filtered = subjects.filter((s) =>
    search ? s.name.includes(search) : true
  );

  return (
    <AppShell>
      <PageHeader
        title="المواد الدراسية"
        description="إدارة المواد الدراسية والمحاضرات"
        action={
          <Button
            onClick={() => setShowAddModal(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            إضافة مادة
          </Button>
        }
      />

      <div className="mb-6">
        <Input
          placeholder="بحث عن مادة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
              <Skeleton height="1.5rem" className="w-1/2 mb-3" />
              <Skeleton height="1rem" className="w-1/3 mb-4" />
              <Skeleton height="1rem" className="w-2/3 mb-2" />
              <Skeleton height="1rem" className="w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={search ? "لا توجد نتائج" : "لا توجد مواد بعد"}
          description={
            search
              ? "جرب البحث بكلمات مختلفة"
              : "ابدأ بإضافة مادة دراسية جديدة"
          }
          actionLabel={!search ? "إضافة مادة" : undefined}
          onAction={!search ? () => setShowAddModal(true) : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((subject, index) => (
            <div
              key={subject.id}
              className="group relative rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-slate-900/50 hover:-translate-y-0.5"
            >
              <div className={`h-2 bg-gradient-to-r ${getColor(index)}`} />

              <div className="p-5">
                {editingId === subject.id ? (
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(subject.id);
                        if (e.key === "Escape") {
                          setEditingId(null);
                          setEditingName("");
                        }
                      }}
                      autoFocus
                      className="flex-1 rounded-xl border border-blue-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-blue-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      onClick={() => handleUpdate(subject.id)}
                      className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditingName("");
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer dark:text-gray-500 dark:hover:bg-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      className="cursor-pointer"
                      onClick={() => router.push(`/subjects/${subject.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getColor(index)} flex items-center justify-center shadow-lg`}>
                            <GraduationCap className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {subject.name}
                            </h3>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {new Date(subject.createdAt).toLocaleDateString("ar-SA", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-4">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4" />
                          <span>{subject._count?.lectures ?? 0} محاضرة</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>آخر تحديث</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(subject.id);
                          setEditingName(subject.name);
                        }}
                        icon={<Pencil className="h-3.5 w-3.5" />}
                        className="flex-1"
                      >
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(subject.id);
                        }}
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        className="flex-1 text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/30"
                      >
                        حذف
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewSubjectName("");
        }}
        title="إضافة مادة جديدة"
      >
        <div className="space-y-4">
          <Input
            label="اسم المادة"
            placeholder="أدخل اسم المادة..."
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            autoFocus
          />
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddModal(false);
                setNewSubjectName("");
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleCreate}
              loading={creating}
              disabled={!newSubjectName.trim()}
            >
              إضافة
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId !== null) handleDelete(deletingId);
        }}
        title="حذف المادة"
        message="هل أنت متأكد من حذف هذه المادة؟ سيتم حذف جميع المحاضرات والسجلات المرتبطة بها."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
      />
    </AppShell>
  );
}

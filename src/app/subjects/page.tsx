"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Play,
  History,
  BookOpen,
  X,
  Check,
  GraduationCap,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { addToast } from "@/components/ui/Toast";
import type { Subject } from "@/types";

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
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
            <Card key={i}>
              <Skeleton height="1.5rem" className="w-1/2 mb-3" />
              <Skeleton height="1rem" className="w-1/3 mb-4" />
              <div className="flex gap-2">
                <Skeleton height="2rem" className="w-20" />
                <Skeleton height="2rem" className="w-20" />
              </div>
            </Card>
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
          {filtered.map((subject) => (
            <Card key={subject.id} className="flex flex-col">
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
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {subject.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="info">
                          {subject._count?.lectures ?? 0} محاضرة
                        </Badge>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(subject.createdAt).toLocaleDateString(
                            "ar-SA"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        router.push(`/attendance/${subject.id}`)
                      }
                      icon={<Play className="h-3.5 w-3.5" />}
                    >
                      بدء الحضور
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/attendance/${subject.id}`)
                      }
                      icon={<History className="h-3.5 w-3.5" />}
                    >
                      التاريخ
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(subject.id);
                        setEditingName(subject.name);
                      }}
                      icon={<Pencil className="h-3.5 w-3.5" />}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletingId(subject.id)}
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    />
                  </div>
                </>
              )}
            </Card>
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

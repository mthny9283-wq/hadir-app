"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  KeyRound,
  Loader2,
  CheckCircle2,
  Copy,
  X,
  Shield,
  Clock,
  HelpCircle,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";

interface User {
  id: number;
  username: string;
  role: string;
  createdAt: string;
  _count: { securityQuestions: number };
}

export default function AccountsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showResetCodeModal, setShowResetCodeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copied, setCopied] = useState<"password" | "code" | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setGenerating(true);

    try {
      const res = await fetch("/api/admin/generate-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "حدث خطأ");
        setGenerating(false);
        return;
      }

      setGeneratedPassword(data.tempPassword);
      setSuccess(`تم إنشاء حساب ${data.user.username} بنجاح`);
      setNewUsername("");
      setGenerating(false);
      fetchUsers();
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
      setGenerating(false);
    }
  };

  const handleGenerateResetCode = async () => {
    if (!selectedUser) return;
    setError("");
    setGeneratedCode("");
    setGeneratingCode(true);

    try {
      const res = await fetch("/api/auth/generate-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "حدث خطأ");
        setGeneratingCode(false);
        return;
      }

      setGeneratedCode(data.code);
      setGeneratingCode(false);
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
      setGeneratingCode(false);
    }
  };

  const copyToClipboard = (text: string, type: "password" | "code") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                إدارة الحسابات
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                توليد الحسابات وأكواد إعادة التعيين
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowGenerateModal(true);
              setError("");
              setSuccess("");
              setGeneratedPassword("");
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            توليد حساب جديد
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">
                لا توجد حسابات بعد
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        user.role === "admin"
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                          : "bg-gradient-to-br from-gray-400 to-gray-500"
                      }`}
                    >
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {user.username}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            user.role === "admin"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              : "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400"
                          }`}
                        >
                          {user.role === "admin" ? "مدير" : "مستخدم"}
                        </span>
                        <span className="flex items-center gap-1">
                          <HelpCircle className="h-3 w-3" />
                          {user._count.securityQuestions} أسئلة أمان
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(user.createdAt).toLocaleDateString("ar-YE")}
                        </span>
                      </div>
                    </div>
                  </div>
                  {user.role !== "admin" && (
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowResetCodeModal(true);
                        setGeneratedCode("");
                        setError("");
                      }}
                      className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-all hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                    >
                      <KeyRound className="h-4 w-4" />
                      توليد كود إعادة تعيين
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowGenerateModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                توليد حساب جديد
              </h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}

            {generatedPassword ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/30">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    تم إنشاء الحساب بنجاح
                  </div>
                  <p className="mb-1 text-xs text-green-600 dark:text-green-500">
                    كلمة المرور المؤقتة:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-white px-3 py-2 font-mono text-sm font-bold text-green-800 dark:bg-slate-700 dark:text-green-300">
                      {generatedPassword}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(generatedPassword, "password")
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600 transition-colors hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400"
                    >
                      {copied === "password" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-green-600/70 dark:text-green-500/70">
                    انسخ كلمة المرور وسليمها للمستخدم
                  </p>
                </div>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerateAccount} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    اسم المستخدم الجديد
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-500"
                    placeholder="أدخل اسم المستخدم"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] disabled:opacity-50"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {generating ? "جاري التوليد..." : "توليد الحساب"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {showResetCodeModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowResetCodeModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                توليد كود إعادة التعيين
              </h3>
              <button
                onClick={() => setShowResetCodeModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-600 dark:bg-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gray-400 to-gray-500">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {selectedUser.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    معرف: {selectedUser.id}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}

            {generatedCode ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/30">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
                    <KeyRound className="h-4 w-4" />
                    تم توليد الكود بنجاح
                  </div>
                  <p className="mb-1 text-xs text-amber-600 dark:text-amber-500">
                    كود إعادة تعيين الباسورد:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-white px-3 py-2 text-center font-mono text-lg font-bold tracking-[0.2em] text-amber-800 dark:bg-slate-700 dark:text-amber-300">
                      {generatedCode}
                    </code>
                    <button
                      onClick={() => copyToClipboard(generatedCode, "code")}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 transition-colors hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400"
                    >
                      {copied === "code" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-amber-600/70 dark:text-amber-500/70">
                    صالح لمدة 24 ساعة — انسخ الكود وسلميه للمستخدم
                  </p>
                </div>
                <button
                  onClick={() => setShowResetCodeModal(false)}
                  className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateResetCode}
                disabled={generatingCode}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] disabled:opacity-50"
              >
                {generatingCode ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                {generatingCode ? "جاري التوليد..." : "توليد الكود"}
              </button>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

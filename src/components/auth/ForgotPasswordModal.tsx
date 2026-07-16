"use client";

import { useState, useEffect } from "react";
import {
  X,
  HelpCircle,
  KeyRound,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Shield,
  ArrowLeft,
  Lock,
} from "lucide-react";

interface SecurityQuestion {
  id: number;
  question: string;
}

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step =
  | "method"
  | "verify-code"
  | "verify-question"
  | "new-password"
  | "done";

export default function ForgotPasswordModal({
  isOpen,
  onClose,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<"code" | "question">("code");

  const [username, setUsername] = useState("");
  const [questions, setQuestions] = useState<SecurityQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setStep("method");
    setMethod("code");
    setUsername("");
    setQuestions([]);
    setSelectedQuestion("");
    setAnswer("");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setLoading(false);
    setError("");
    setSuccess("");
  };

  const handleSelectMethod = (m: "code" | "question") => {
    setMethod(m);
    setError("");
    if (m === "code") {
      setStep("verify-code");
    } else {
      setStep("verify-question");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          code: resetCode.trim(),
          verifyOnly: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 && data.error?.includes("غير صحيح")) {
          setError("كود التحقق غير صحيح");
        } else {
          setError(data.error || "حدث خطأ");
        }
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep("new-password");
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
      setLoading(false);
    }
  };

  const handleLoadQuestions = async () => {
    if (!username.trim()) {
      setError("يرجى إدخال اسم المستخدم");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `/api/auth/security-questions?username=${encodeURIComponent(username.trim())}`
      );
      const data = await res.json();

      if (res.ok && data.questions?.length > 0) {
        setQuestions(data.questions);
        setLoading(false);
      } else {
        setError("لا توجد أسئلة أمان لهذا المستخدم. استخدم كود التحقق بدلاً منها");
        setLoading(false);
      }
    } catch {
      setError("حدث خطأ في الاتصال");
      setLoading(false);
    }
  };

  const handleVerifyQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          questionId: selectedQuestion,
          answer,
          verifyOnly: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setError("الإجابة غير صحيحة");
        } else {
          setError(data.error || "حدث خطأ");
        }
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep("new-password");
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("كلمة المرور غير متطابقة");
      return;
    }
    if (newPassword.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setLoading(true);

    try {
      let res;

      if (method === "code") {
        res = await fetch("/api/auth/verify-reset-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            code: resetCode.trim(),
            newPassword,
          }),
        });
      } else {
        res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            questionId: selectedQuestion,
            answer,
            newPassword,
          }),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "حدث خطأ");
        setLoading(false);
        return;
      }

      setSuccess("تم إعادة تعيين كلمة المرور بنجاح!");
      setStep("done");
      setLoading(false);
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl dark:border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            {step !== "method" && step !== "done" && (
              <button
                onClick={() => {
                  if (step === "verify-code" || step === "verify-question") {
                    setStep("method");
                  } else if (step === "new-password") {
                    setStep(
                      method === "code" ? "verify-code" : "verify-question"
                    );
                  }
                  setError("");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {step === "method" && "إعادة تعيين كلمة المرور"}
                {step === "verify-code" && "التحقق بالكود"}
                {step === "verify-question" && "التحقق بالسؤال"}
                {step === "new-password" && "كلمة المرور الجديدة"}
                {step === "done" && "تم بنجاح!"}
              </h3>
              <p className="text-xs text-white/60">
                {step === "method" && "اختر طريقة إعادة التعيين"}
                {step === "verify-code" && "أدخل اسم المستخدم والكود"}
                {step === "verify-question" && "أجب على سؤال الأمان"}
                {step === "new-password" && "أدخل كلمة المرور الجديدة"}
                {step === "done" && "يمكنك تسجيل الدخول الآن"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === "method" && (
            <div className="space-y-3">
              <p className="mb-4 text-center text-sm text-white/70">
                كيف تريد إعادة تعيين كلمة المرور؟
              </p>
              <button
                onClick={() => handleSelectMethod("code")}
                className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-right transition-all hover:bg-white/10 hover:border-white/20"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
                  <KeyRound className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-white">كود إعادة التعيين</p>
                  <p className="text-xs text-white/50">
                    أدخل الكود الذي حصلت عليه من المدير
                  </p>
                </div>
              </button>
              <button
                onClick={() => handleSelectMethod("question")}
                className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-right transition-all hover:bg-white/10 hover:border-white/20"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                  <HelpCircle className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <p className="font-bold text-white">سؤال الأمان</p>
                  <p className="text-xs text-white/50">
                    أجب على السؤال الذي اخترته عند التسجيل
                  </p>
                </div>
              </button>
            </div>
          )}

          {step === "verify-code" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">
                  اسم المستخدم
                </label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pr-12 pl-4 text-sm text-white placeholder-white/40 transition-all focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="أدخل اسم المستخدم"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">
                  كود إعادة التعيين
                </label>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center font-mono text-lg tracking-[0.3em] text-white placeholder-white/40 transition-all focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="XXXX-XXXX"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-indigo-700 shadow-lg transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    التحقق من الكود
                  </>
                )}
              </button>
            </form>
          )}

          {step === "verify-question" && (
            <div className="space-y-4">
              {questions.length === 0 ? (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/90">
                      اسم المستخدم
                    </label>
                    <div className="relative">
                      <User className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pr-12 pl-4 text-sm text-white placeholder-white/40 transition-all focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                        placeholder="أدخل اسم المستخدم"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleLoadQuestions}
                    disabled={loading || !username.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-medium text-white transition-all hover:bg-white/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <HelpCircle className="h-4 w-4" />
                    )}
                    {loading ? "جاري التحميل..." : "تحميل أسئلة الأمان"}
                  </button>
                </>
              ) : (
                <form onSubmit={handleVerifyQuestion} className="space-y-4">
                  <div className="rounded-lg border border-amber-400/30 bg-amber-500/20 px-3 py-2">
                    <p className="text-[11px] font-medium text-amber-200">
                      أجب بالإنجليزية — الإجابة حساسة لحالة الأحرف (A ≠ a)
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/90">
                      اختر سؤال الأمان
                    </label>
                    <select
                      value={selectedQuestion}
                      onChange={(e) => setSelectedQuestion(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white transition-all focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                      required
                    >
                      <option value="" className="bg-slate-800">
                        -- اختر سؤالاً --
                      </option>
                      {questions.map((q) => (
                        <option
                          key={q.id}
                          value={q.id}
                          className="bg-slate-800"
                        >
                          {q.question}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/90">
                      إجابتك
                    </label>
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 transition-all focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                      placeholder="Answer in English (case-sensitive)"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-indigo-700 shadow-lg transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <HelpCircle className="h-4 w-4" />
                        التحقق من الإجابة
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {step === "new-password" && (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-green-500/20 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                <p className="text-xs font-medium text-green-200">
                  التحقق ناجح — أدخل كلمة المرور الجديدة
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pr-12 pl-12 text-sm text-white placeholder-white/40 transition-all focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="أدخل كلمة المرور الجديدة"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">
                  تأكيد كلمة المرور
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 transition-all focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="أعد إدخال كلمة المرور"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-indigo-700 shadow-lg transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    حفظ كلمة المرور الجديدة
                  </>
                )}
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <p className="mb-6 text-sm text-white/80">{success}</p>
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-white py-3 text-sm font-bold text-indigo-700 transition-all hover:bg-white/90"
              >
                تسجيل الدخول
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

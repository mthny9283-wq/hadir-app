"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  Save,
  Users,
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";

interface ImportResult {
  added: number;
  skipped: number;
}

export default function StudentImportPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<{
    total: number;
    duplicates: number;
    unique: string[];
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = () => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const seen = new Set<string>();
    const unique: string[] = [];
    let duplicates = 0;

    for (const name of lines) {
      if (seen.has(name)) {
        duplicates++;
      } else {
        seen.add(name);
        unique.push(name);
      }
    }

    setPreview({ total: lines.length, duplicates, unique });
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: preview.unique }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "فشل استيراد الطلاب");
      }
      const data = await res.json();
      setResult({ added: data.added, skipped: data.duplicates ?? preview.duplicates });
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setImporting(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-5 p-4 pb-24">
        <header className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">استيراد الطلاب جماعياً</h1>
            <p className="text-sm text-gray-500">أدخل أسماء الطلاب لإضافتهم دفعة واحدة</p>
          </div>
        </header>

        {result ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
            <h2 className="mt-4 text-lg font-bold text-gray-900">تم الاستيراد بنجاح</h2>
            <div className="mt-3 flex items-center justify-center gap-4 text-sm">
              <span className="rounded-lg bg-green-100 px-3 py-1.5 font-medium text-green-700">
                تمت الإضافة: {result.added} طالباً
              </span>
              {result.skipped > 0 && (
                <span className="rounded-lg bg-orange-100 px-3 py-1.5 font-medium text-orange-700">
                  تم تجاهل: {result.skipped} مكرر
                </span>
              )}
            </div>
            <button
              onClick={() => router.push("/students")}
              className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              العودة لقائمة الطلاب
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText className="h-4 w-4" />
                أسماء الطلاب
              </label>
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setPreview(null);
                }}
                placeholder={"أدخل اسم طالب في كل سطر\nمحمد أحمد\nأحمد علي\nخالد محمد\n..."}
                dir="auto"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                style={{ minHeight: 300 }}
              />
              <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                <AlertCircle className="h-3.5 w-3.5" />
                كل سطر يمثل طالباً واحداً. يُتجاهل السطر الفارغ.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handlePreview}
                disabled={!text.trim()}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Eye className="h-4 w-4" />
                معاينة
              </button>
              {preview && (
                <button
                  onClick={handleImport}
                  disabled={importing || preview.unique.length === 0}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  حفظ الكل
                </button>
              )}
            </div>

            {preview && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">نتيجة المعاينة</h3>
                <div className="mb-4 flex flex-wrap gap-3">
                  <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                    الإجمالي: {preview.total}
                  </span>
                  <span className="rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
                    فريد: {preview.unique.length}
                  </span>
                  {preview.duplicates > 0 && (
                    <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700">
                      مكرر: {preview.duplicates}
                    </span>
                  )}
                </div>
                {preview.unique.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-gray-500">قائمة الأسماء الفريدة:</p>
                    <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50">
                      <ul className="divide-y divide-gray-100">
                        {preview.unique.map((name, i) => (
                          <li key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-medium text-blue-600">
                              {i + 1}
                            </span>
                            {name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {preview.unique.length === 0 && (
                  <div className="rounded-xl bg-orange-50 p-4 text-center text-sm text-orange-700">
                    لا توجد أسماء فريدة للاستيراد
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import {
  FileSpreadsheet,
  FileText,
  Filter,
  Download,
  ChevronDown,
} from "lucide-react";
import logoUrl from "../../../public/21596432407.png";

interface Lecture {
  id: number;
  lectureNumber: number;
  date: string;
}

interface StudentAttendance {
  lectureNumber: number;
  status: "present" | "absent" | "guest";
}

interface Student {
  name: string;
  attendance: StudentAttendance[];
  percentage: number;
  presentCount: number;
  absentCount: number;
  guestCount: number;
}

interface Subject {
  id: number;
  name: string;
}

interface ReportData {
  subject: { name: string };
  lectures: Lecture[];
  students: Student[];
}

export default function ReportsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [attendanceHistory, setAttendanceHistory] = useState<Lecture[]>([]);
  const [fromLecture, setFromLecture] = useState("");
  const [toLecture, setToLecture] = useState("");
  const [editableData, setEditableData] = useState<ReportData | null>(null);

  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch("/api/subjects");
        if (!res.ok) throw new Error("فشل تحميل المواد");
        const data = await res.json();
        setSubjects(data);
      } catch {
        setError("حدث خطأ أثناء تحميل المواد");
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  const fetchAttendanceHistory = useCallback(async (subjectId: string) => {
    setLoadingHistory(true);
    setError("");
    setAttendanceHistory([]);
    setFromLecture("");
    setToLecture("");
    setEditableData(null);
    try {
      const res = await fetch(`/api/attendance/history?subjectId=${subjectId}`);
      if (!res.ok) throw new Error("فشل تحميل سجل الحضور");
      const data = await res.json();
      setAttendanceHistory(data);
    } catch {
      setError("حدث خطأ أثناء تحميل سجل الحضور");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    if (subjectId) {
      fetchAttendanceHistory(subjectId);
    } else {
      setAttendanceHistory([]);
      setFromLecture("");
      setToLecture("");
      setEditableData(null);
    }
  };

  const generateReport = async () => {
    if (!selectedSubjectId || !fromLecture || !toLecture) return;
    setLoadingReport(true);
    setError("");
    setEditableData(null);
    try {
      const res = await fetch(
        `/api/reports?subjectId=${selectedSubjectId}&fromLecture=${fromLecture}&toLecture=${toLecture}`,
      );
      if (!res.ok) throw new Error("فشل إنشاء التقرير");
      const data = await res.json();
      setEditableData(JSON.parse(JSON.stringify(data)));
    } catch {
      setError("حدث خطأ أثناء إنشاء التقرير");
    } finally {
      setLoadingReport(false);
    }
  };

  const toggleAttendance = (studentIdx: number, lectureNumber: number) => {
    if (!editableData) return;
    const newData = { ...editableData };
    const students = [...newData.students];
    const student = { ...students[studentIdx] };
    const attendance = [...student.attendance];
    const attIdx = attendance.findIndex(
      (a) => a.lectureNumber === lectureNumber,
    );
    if (attIdx >= 0) {
      const att = { ...attendance[attIdx] };
      const cycle: Record<string, "present" | "absent" | "guest"> = { present: "absent", absent: "guest", guest: "present" };
      att.status = cycle[att.status] || "present";
      attendance[attIdx] = att;
    }
    student.attendance = attendance;
    student.presentCount = attendance.filter(
      (a) => a.status === "present",
    ).length;
    student.absentCount = attendance.filter(
      (a) => a.status === "absent",
    ).length;
    student.guestCount = attendance.filter(
      (a) => a.status === "guest",
    ).length;
    student.percentage =
      newData.lectures.length > 0
        ? (student.presentCount / newData.lectures.length) * 100
        : 0;
    students[studentIdx] = student;
    newData.students = students;
    setEditableData(newData);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  };

  const currentYear = new Date().getFullYear();

  const exportToExcel = async () => {
    if (!editableData) return;
    try {
      const lecCount = editableData.lectures.length;
      const totalPresent = editableData.students.reduce(
        (s, st) => s + st.presentCount,
        0,
      );
      const totalAbsent = editableData.students.reduce(
        (s, st) => s + st.absentCount,
        0,
      );
      const totalGuest = editableData.students.reduce(
        (s, st) => s + st.guestCount,
        0,
      );
      const totalPct = (
        (totalPresent / (editableData.students.length * lecCount)) *
        100
      ).toFixed(1);
      const serialWidth = 5;
      const nameWidth = 25;
      const lecColWidth = 12;

      const rows: string[][] = [
        [
          "الجمهورية اليمنية",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "المستوى: الثاني",
        ],
        [
          "جامعة ذمار",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "القسم: الأمن السيبراني",
        ],
        [
          "كلية الحاسبات والمعلوماتية",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          `المادة: ${editableData.subject.name}`,
        ],
        [
          "",
          "",
          "",
          "",
          "",
          `كشف الحضور والغياب — ${currentYear}`,
          "",
          "",
          "",
          "",
        ],
        [],
        [
          "م",
          "اسم الطالب",
          ...editableData.lectures.map((l) => `م${l.lectureNumber}`),
          "حضور",
          "غياب",
          "مستاذن",
        ],
      ];

      editableData.students.forEach((s, idx) => {
        rows.push([
          String(idx + 1),
          s.name,
          ...editableData.lectures.map((l) => {
            const att = s.attendance.find(
              (a) => a.lectureNumber === l.lectureNumber,
            );
            return att?.status === "present" ? "✓" : att?.status === "guest" ? "م" : "✗";
          }),
          String(s.presentCount),
          String(s.absentCount),
          String(s.guestCount),
        ]);
      });

      rows.push([]);
      rows.push(["", "", "", ...Array(lecCount).fill(""), "الإجمالي"]);
      rows.push([
        "",
        "",
        "",
        ...Array(lecCount).fill(""),
        String(totalPresent),
        String(totalAbsent),
        String(totalGuest),
      ]);
      rows.push([]);
      rows.push(["", "", "", ...Array(lecCount).fill(""), "نسبة الحضور"]);
      rows.push(["", "", "", ...Array(lecCount).fill(""), `${totalPct}%`]);

      let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" dir="rtl"><head><meta charset="utf-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
        <x:Name>كشف الحضور</x:Name>
        <x:WorksheetOptions><x:DisplayRightToLeft/></x:WorksheetOptions>
        </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          body{font-family:Arial,sans-serif;direction:rtl;text-align:right}
          table{border-collapse:collapse;direction:rtl}
          td,th{border:1px solid #999;padding:5px 8px;text-align:center;direction:rtl}
          th{background:#1e40af;color:#fff;font-weight:bold;font-size:11px}
          .header-info{font-size:12px;line-height:1.8}
          .header-info td{border:none;text-align:right;padding:2px 8px;font-size:12px}
          .title-row td{border:none;text-align:center;font-size:14px;font-weight:bold;color:#1e40af;padding:8px}
          .serial{width:30px}
          .name{text-align:right;font-weight:bold}
          .present{color:#16a34a;font-weight:bold}
          .absent{color:#dc2626;font-weight:bold}
          .guest{color:#9333ea;font-weight:bold}
          .total-row td{background:#e2e8f0;font-weight:bold}
          .pct-row td{background:#dbeafe;font-weight:bold;color:#1d4ed8}
        </style></head><body><table>`;

      html += `<tr class="header-info"><td style="width:${serialWidth}%">الجمهورية اليمنية</td><td style="width:${nameWidth}%"></td>`;
      editableData.lectures.forEach(() => {
        html += `<td style="width:${lecColWidth}%"></td>`;
      });
      html += `<td style="width:6%"></td><td style="width:6%"></td><td style="width:6%">المستوى: الثاني</td></tr>`;

      html += `<tr class="header-info"><td>جامعة ذمار</td><td></td>`;
      editableData.lectures.forEach(() => {
        html += `<td></td>`;
      });
      html += `<td></td><td></td><td>القسم: الأمن السيبراني</td></tr>`;

      html += `<tr class="header-info"><td>كلية الحاسبات والمعلوماتية</td><td></td>`;
      editableData.lectures.forEach(() => {
        html += `<td></td>`;
      });
      html += `<td></td><td></td><td>المادة: ${editableData.subject.name}</td></tr>`;

      html += `<tr class="title-row"><td colspan="${2 + lecCount + 2}">كشف الحضور والغياب — ${currentYear}</td></tr>`;
      html += `<tr><td colspan="${2 + lecCount + 2}"></td></tr>`;

      html += `<tr><th style="width:${serialWidth}%">م</th><th style="width:${nameWidth}%">اسم الطالب</th>`;
      editableData.lectures.forEach((l) => {
        html += `<th style="width:${lecColWidth}%">م${l.lectureNumber}</th>`;
      });
      html += `<th style="width:6%">حضور</th><th style="width:6%">غياب</th><th style="width:6%">مستاذن</th></tr>`;

      editableData.students.forEach((s, idx) => {
        html += `<tr><td class="serial">${idx + 1}</td><td class="name" style="text-align:right">${s.name}</td>`;
        editableData.lectures.forEach((l) => {
          const att = s.attendance.find(
            (a) => a.lectureNumber === l.lectureNumber,
          );
          const isP = att?.status === "present";
          const isG = att?.status === "guest";
          html += `<td class="${isP ? "present" : isG ? "guest" : "absent"}">${isP ? "✓" : isG ? "م" : "✗"}</td>`;
        });
        html += `<td>${s.presentCount}</td><td>${s.absentCount}</td><td>${s.guestCount}</td></tr>`;
      });

      html += `<tr><td colspan="${2 + lecCount}"></td><td>الإجمالي</td><td>${totalPresent}</td><td>${totalAbsent}</td><td>${totalGuest}</td></tr>`;
      html += `<tr><td colspan="${2 + lecCount}"></td><td>نسبة الحضور</td><td colspan="3">${totalPct}%</td></tr>`;

      html += `</table></body></html>`;

      const bom = "\uFEFF";
      const blob = new Blob([bom + html], {
        type: "application/vnd.ms-excel;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `تقرير_${editableData.subject.name}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setError("حدث خطأ أثناء تصدير الملف");
    }
  };

  const exportToPdf = async () => {
    if (!editableData) return;
    try {
      const logoDataUrl = await fetch(logoUrl.src)
        .then((r) => r.blob())
        .then(
          (blob) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            }),
        );

      const lecCount = editableData.lectures.length;
      const totalPresent = editableData.students.reduce(
        (s, st) => s + st.presentCount,
        0,
      );
      const totalAbsent = editableData.students.reduce(
        (s, st) => s + st.absentCount,
        0,
      );
      const totalGuest = editableData.students.reduce(
        (s, st) => s + st.guestCount,
        0,
      );
      const totalPct = (
        (totalPresent / (editableData.students.length * lecCount)) *
        100
      ).toFixed(1);

      let html = `<html><head><meta charset="utf-8"><style>
        body{font-family:sans-serif;direction:rtl;text-align:right;margin:20px}
        .header{width:100%;border-bottom:3px solid #1e40af;padding-bottom:15px;margin-bottom:20px}
        .header-table{width:100%;border-collapse:collapse}
        .header-table td{padding:4px 8px;vertical-align:top}
        .right{direction:rtl;text-align:right;font-size:14px;line-height:1.8}
        .left{direction:rtl;text-align:left;font-size:14px;line-height:1.8}
        .center{text-align:center;padding:10px 0}
        .title{text-align:center;font-size:16px;color:#333;margin:10px 0}
        table.data{width:100%;border-collapse:collapse;margin-top:15px}
        table.data th,table.data td{border:1px solid #ccc;padding:6px;text-align:center}
        table.data th{background:#1e40af;color:#fff;font-size:12px}
        tr:nth-child(even){background:#f3f4f6}
        .present{color:#16a34a;font-weight:bold}
        .absent{color:#dc2626;font-weight:bold}
        .guest{color:#9333ea;font-weight:bold}
        .footer{margin-top:20px;text-align:center;font-size:11px;color:#666;border-top:1px solid #ddd;padding-top:10px}
      </style></head><body>
      <div class="header">
        <table class="header-table">
          <tr>
            <td class="right" style="width:45%">
              الجمهـــورية اليمنيـــة<br>
              جامعـــــة ذمـــــار<br>
              كلية الحاسبات والمعلوماتية
            </td>
            <td class="center" style="width:10%">
              <img src="${logoDataUrl}" style="width:55px;height:55px;object-fit:contain" />
            </td>
            <td class="left" style="width:45%">
              المستوى: الثاني<br>
              القسم: الأمن السيبراني<br>
              المادة: ${editableData.subject.name}
            </td>
          </tr>
        </table>
        <div class="title">كشف الحضور والغياب — ${currentYear}</div>
      </div>
      <p style="font-size:13px;color:#555">المحاضرات ${fromLecture} - ${toLecture} | عدد الطلاب: ${editableData.students.length}</p>
      <table class="data"><thead><tr><th>م</th><th>اسم الطالب</th>`;
      editableData.lectures.forEach((l) => {
        html += `<th>م${l.lectureNumber}</th>`;
      });
      html += `<th>حضور</th><th>غياب</th><th>مستاذن</th></tr></thead><tbody>`;
      editableData.students.forEach((s, idx) => {
        html += `<tr><td>${idx + 1}</td><td style="text-align:right">${s.name}</td>`;
        editableData.lectures.forEach((l) => {
          const att = s.attendance.find(
            (a) => a.lectureNumber === l.lectureNumber,
          );
          const isP = att?.status === "present";
          const isG = att?.status === "guest";
          html += `<td class="${isP ? "present" : isG ? "guest" : "absent"}">${isP ? "✓" : isG ? "م" : "✗"}</td>`;
        });
        html += `<td>${s.presentCount}</td><td>${s.absentCount}</td><td>${s.guestCount}</td></tr>`;
      });
      html += `<tr style="font-weight:bold;background:#e2e8f0"><td colspan="2">الإجمالي</td>${Array(lecCount).fill("<td></td>").join("")}<td>${totalPresent}</td><td>${totalAbsent}</td><td>${totalGuest}</td></tr>`;
      html += `<tr style="background:#dbeafe"><td colspan="${2 + lecCount}" style="font-weight:bold;text-align:right">نسبة الحضور</td><td colspan="3" style="font-weight:bold;color:#1d4ed8">${totalPct}%</td></tr>`;
      html += `</tbody></table>
      <div class="footer">نظام "حاضر | HADIR" — إدارة حضور وغياب الطلاب</div>
      </body></html>`;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }
    } catch {
      setError("حدث خطأ أثناء إنشاء PDF");
    }
  };

  const sortedHistory = [...attendanceHistory].sort(
    (a, b) => a.lectureNumber - b.lectureNumber,
  );

  const filteredToLectures = sortedHistory.filter((l) => {
    if (!fromLecture) return true;
    return l.lectureNumber >= Number(fromLecture);
  });

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-6">
        <header className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 shrink-0">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              التقارير
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              عرض وتصدير تقارير الحضور والغياب
            </p>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-blue-500" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              فلتر التقرير
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 items-end">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                المادة
              </label>
              {loadingSubjects ? (
                <Skeleton className="h-11 w-full" />
              ) : (
                <div className="relative">
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="">اختر المادة</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                من محاضرة
              </label>
              {loadingHistory ? (
                <Skeleton className="h-11 w-full" />
              ) : (
                <div className="relative">
                  <select
                    value={fromLecture}
                    onChange={(e) => {
                      setFromLecture(e.target.value);
                      if (
                        toLecture &&
                        Number(e.target.value) > Number(toLecture)
                      ) {
                        setToLecture(e.target.value);
                      }
                      setEditableData(null);
                    }}
                    disabled={!selectedSubjectId}
                    className="w-full appearance-none rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="">من</option>
                    {sortedHistory.map((lecture) => (
                      <option key={lecture.id} value={lecture.lectureNumber}>
                        المحاضرة {lecture.lectureNumber} -{" "}
                        {formatDate(lecture.date)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                إلى محاضرة
              </label>
              {loadingHistory ? (
                <Skeleton className="h-11 w-full" />
              ) : (
                <div className="relative">
                  <select
                    value={toLecture}
                    onChange={(e) => {
                      setToLecture(e.target.value);
                      setEditableData(null);
                    }}
                    disabled={!selectedSubjectId}
                    className="w-full appearance-none rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="">إلى</option>
                    {filteredToLectures.map((lecture) => (
                      <option key={lecture.id} value={lecture.lectureNumber}>
                        المحاضرة {lecture.lectureNumber} -{" "}
                        {formatDate(lecture.date)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                </div>
              )}
            </div>

            <Button
              onClick={generateReport}
              disabled={
                !selectedSubjectId ||
                !fromLecture ||
                !toLecture ||
                loadingReport
              }
              loading={loadingReport}
              className="w-full sm:w-auto"
            >
              عرض التقرير
            </Button>
          </div>
        </Card>

        {loadingReport && (
          <Card className="p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="space-y-3 mt-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        )}

        {!loadingReport && !editableData && !loadingSubjects && (
          <EmptyState
            icon={FileText}
            title="لم يتم إنشاء تقرير بعد"
            description="اختر المادة ونطاق المحاضرات ثم اضغط عرض التقرير"
          />
        )}

        {editableData && (
          <Card>
            <div className="p-3 sm:p-6 space-y-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  تقرير {editableData.subject.name}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  المحاضرات {fromLecture} - {toLecture} •{" "}
                  {editableData.students.length} طالب
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  انقر على أي خلية ✓/✗ لتعديلها
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={exportToExcel}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  تصدير CSV
                </button>
                <button
                  onClick={exportToPdf}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  تصدير PDF
                </button>
              </div>

              <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
                <table
                  className="w-full text-xs sm:text-sm"
                  style={{ minWidth: "550px" }}
                >
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-700">
                      <th className="px-2 py-2.5 text-center text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-slate-600 whitespace-nowrap">
                        م
                      </th>
                      <th className="px-2 py-2.5 text-right text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-slate-600 whitespace-nowrap">
                        الطالب
                      </th>
                      {editableData.lectures.map((lecture) => (
                        <th
                          key={lecture.id}
                          className="px-1.5 sm:px-2 py-2.5 text-center text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-slate-600 whitespace-nowrap"
                        >
                          <div>م{lecture.lectureNumber}</div>
                          <div className="text-gray-400 dark:text-gray-500 font-normal mt-0.5 text-[9px] sm:text-[10px]">
                            {formatDate(lecture.date)}
                          </div>
                        </th>
                      ))}
                      <th className="px-1.5 sm:px-2 py-2.5 text-center text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-slate-600 whitespace-nowrap">
                        ح
                      </th>
                      <th className="px-1.5 sm:px-2 py-2.5 text-center text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-slate-600 whitespace-nowrap">
                        غ
                      </th>
                      <th className="px-1.5 sm:px-2 py-2.5 text-center text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-slate-600 whitespace-nowrap">
                        م
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {editableData.students.map((student, sIdx) => (
                      <tr
                        key={sIdx}
                        className={`transition-colors hover:bg-gray-50 dark:hover:bg-slate-700 ${
                          sIdx % 2 === 0
                            ? "bg-white dark:bg-slate-800"
                            : "bg-gray-50/50 dark:bg-slate-700/50"
                        }`}
                      >
                        <td className="px-2 py-2.5 text-center text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                          {sIdx + 1}
                        </td>
                        <td className="px-2 py-2.5 text-gray-900 dark:text-white font-medium whitespace-nowrap">
                          {student.name}
                        </td>
                        {editableData.lectures.map((lecture) => {
                          const att = student.attendance.find(
                            (a) => a.lectureNumber === lecture.lectureNumber,
                          );
                          const isPresent = att?.status === "present";
                          const isGuest = att?.status === "guest";
                          return (
                            <td
                              key={lecture.id}
                              className="px-1.5 sm:px-2 py-2.5 text-center"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  toggleAttendance(sIdx, lecture.lectureNumber)
                                }
                                className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs sm:text-sm font-bold cursor-pointer transition-all active:scale-90 ${
                                  isPresent
                                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                                    : isGuest
                                    ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100"
                                    : "bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100"
                                }`}
                              >
                                {isPresent ? "✓" : isGuest ? "م" : "✗"}
                              </button>
                            </td>
                          );
                        })}
                        <td className="px-1.5 sm:px-2 py-2.5 text-center">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {student.presentCount}
                          </span>
                        </td>
                        <td className="px-1.5 sm:px-2 py-2.5 text-center">
                          <span className="text-red-500 dark:text-red-400 font-semibold">
                            {student.absentCount}
                          </span>
                        </td>
                        <td className="px-1.5 sm:px-2 py-2.5 text-center">
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">
                            {student.guestCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 dark:bg-slate-700 border-t-2 border-gray-300 dark:border-slate-600">
                      <td className="px-2 py-2.5"></td>
                      <td className="px-2 py-2.5 text-gray-900 dark:text-white font-bold">
                        الإجمالي
                      </td>
                      {editableData.lectures.map((lecture) => {
                        const presentCount = editableData.students.filter(
                          (s) => {
                            const att = s.attendance.find(
                              (a) => a.lectureNumber === lecture.lectureNumber,
                            );
                            return att?.status === "present";
                          },
                        ).length;
                        return (
                          <td
                            key={lecture.id}
                            className="px-1.5 sm:px-2 py-2.5 text-center"
                          >
                            <span className="font-bold text-gray-700 dark:text-gray-300">
                              {presentCount}/{editableData.students.length}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-1.5 sm:px-2 py-2.5 text-center">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {editableData.students.reduce(
                            (s, st) => s + st.presentCount,
                            0,
                          )}
                        </span>
                      </td>
                      <td className="px-1.5 sm:px-2 py-2.5 text-center">
                        <span className="font-bold text-red-500 dark:text-red-400">
                          {editableData.students.reduce(
                            (s, st) => s + st.absentCount,
                            0,
                          )}
                        </span>
                      </td>
                      <td className="px-1.5 sm:px-2 py-2.5 text-center">
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {editableData.students.reduce(
                            (s, st) => s + st.guestCount,
                            0,
                          )}
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-blue-50 dark:bg-blue-900/30 border-t border-blue-200 dark:border-blue-800">
                      <td
                        className="px-2 py-2.5 text-blue-900 dark:text-blue-300 font-bold"
                        colSpan={editableData.lectures.length + 2}
                      >
                        نسبة الحضور
                      </td>
                      <td
                        className="px-1.5 sm:px-2 py-2.5 text-center"
                        colSpan={3}
                      >
                        <span className="font-bold text-blue-700 dark:text-blue-400">
                          {(
                            (editableData.students.reduce(
                              (s, st) => s + st.presentCount,
                              0,
                            ) /
                              (editableData.students.length *
                                editableData.lectures.length)) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

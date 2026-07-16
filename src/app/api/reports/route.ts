export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const fromLecture = searchParams.get("fromLecture");
    const toLecture = searchParams.get("toLecture");

    if (!subjectId) {
      return NextResponse.json(
        { error: "subjectId query parameter is required" },
        { status: 400 }
      );
    }

    const subjectIdNum = parseInt(subjectId);
    if (isNaN(subjectIdNum)) {
      return NextResponse.json(
        { error: "subjectId must be a valid number" },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectIdNum },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const lectureWhere: any = { subjectId: subjectIdNum };

    if (fromLecture || toLecture) {
      lectureWhere.lectureNumber = {};
      if (fromLecture) lectureWhere.lectureNumber.gte = parseInt(fromLecture);
      if (toLecture) lectureWhere.lectureNumber.lte = parseInt(toLecture);
    }

    const lectures = await prisma.lecture.findMany({
      where: lectureWhere,
      orderBy: { lectureNumber: "asc" },
    });

    const students = await prisma.student.findMany({
      orderBy: { name: "asc" },
    });

    const allAttendance = await prisma.attendance.findMany({
      where: {
        lectureId: { in: lectures.map((l) => l.id) },
        studentId: { in: students.map((s) => s.id) },
      },
    });

    const attendanceMatrix: Record<number, Record<number, string>> = {};
    for (const record of allAttendance) {
      if (!attendanceMatrix[record.studentId]) {
        attendanceMatrix[record.studentId] = {};
      }
      attendanceMatrix[record.studentId][record.lectureId] = record.status;
    }

    const studentsWithAttendance = students.map((student) => {
      const studentAttendance = lectures.map((lecture) => ({
        lectureId: lecture.id,
        lectureNumber: lecture.lectureNumber,
        status: attendanceMatrix[student.id]?.[lecture.id] || "absent",
      }));

      const presentCount = studentAttendance.filter(
        (a) => a.status === "present"
      ).length;
      const percentage =
        lectures.length > 0
          ? Math.round((presentCount / lectures.length) * 100)
          : 0;

      return {
        id: student.id,
        name: student.name,
        attendance: studentAttendance,
        presentCount,
        absentCount: lectures.length - presentCount,
        percentage,
      };
    });

    return NextResponse.json({
      subject,
      lectures: lectures.map((l) => ({
        id: l.id,
        lectureNumber: l.lectureNumber,
        date: l.date,
        isCompleted: l.isCompleted,
      })),
      students: studentsWithAttendance,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

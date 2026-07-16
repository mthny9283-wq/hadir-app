export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

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

    const lectures = await prisma.lecture.findMany({
      where: { subjectId: subjectIdNum },
      orderBy: { lectureNumber: "desc" },
      include: {
        attendance: { select: { status: true } },
      },
    });

    const result = lectures.map((lecture) => ({
      id: lecture.id,
      lectureNumber: lecture.lectureNumber,
      date: lecture.date,
      isCompleted: lecture.isCompleted,
      presentCount: lecture.attendance.filter((a) => a.status === "present").length,
      absentCount: lecture.attendance.filter((a) => a.status === "absent").length,
      totalStudents: lecture.attendance.length,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch attendance history" },
      { status: 500 }
    );
  }
}

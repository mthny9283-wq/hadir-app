export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lectureId } = body;

    if (!lectureId || typeof lectureId !== "number") {
      return NextResponse.json(
        { error: "lectureId is required and must be a number" },
        { status: 400 }
      );
    }

    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: { attendance: true },
    });

    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    await prisma.lecture.update({
      where: { id: lectureId },
      data: { isCompleted: true },
    });

    const presentCount = lecture.attendance.filter(
      (a) => a.status === "present"
    ).length;
    const absentCount = lecture.attendance.filter(
      (a) => a.status === "absent"
    ).length;
    const totalStudents = lecture.attendance.length;

    return NextResponse.json({
      lectureId,
      isCompleted: true,
      presentCount,
      absentCount,
      totalStudents,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to complete lecture" },
      { status: 500 }
    );
  }
}

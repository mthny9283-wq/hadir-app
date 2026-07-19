export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lectureId, sessionId } = body;

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

    if (lecture.isCompleted) {
      return NextResponse.json(
        { error: "Lecture is already completed" },
        { status: 400 }
      );
    }

    if (lecture.createdBy && sessionId && lecture.createdBy !== sessionId) {
      return NextResponse.json(
        { error: "Only the lecture creator can close it" },
        { status: 403 }
      );
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.lecture.update({
        where: { id: lectureId },
        data: {
          isCompleted: true,
          closedBy: sessionId || null,
          closedAt: now,
        },
      });

      await tx.attendance.updateMany({
        where: { lectureId },
        data: { lockedBy: null, lockedAt: null, lockedBySession: null },
      });

      await tx.auditLog.create({
        data: {
          lectureId,
          action: "complete",
          performedBy: sessionId || null,
        },
      });

      await tx.draftSession.deleteMany({
        where: { lectureId },
      });
    });

    const supabase = getSupabaseServer();
    await supabase.channel(`lecture-${lectureId}`).send({
      type: "broadcast",
      event: "lecture_completed",
      payload: { lectureId },
    });

    const presentCount = lecture.attendance.filter(
      (a) => a.status === "present"
    ).length;
    const absentCount = lecture.attendance.filter(
      (a) => a.status === "absent"
    ).length;
    const guestCount = lecture.attendance.filter(
      (a) => a.status === "guest"
    ).length;
    const totalStudents = lecture.attendance.length;

    return NextResponse.json({
      lectureId,
      isCompleted: true,
      presentCount,
      absentCount,
      guestCount,
      totalStudents,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to complete lecture" },
      { status: 500 }
    );
  }
}

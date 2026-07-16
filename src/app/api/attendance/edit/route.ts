export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attendanceId, status } = body;

    if (!attendanceId || typeof attendanceId !== "number") {
      return NextResponse.json(
        { error: "attendanceId is required and must be a number" },
        { status: 400 }
      );
    }

    if (!status || !["present", "absent", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'present', 'absent', or 'pending'" },
        { status: 400 }
      );
    }

    const existing = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { lecture: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    if (existing.lecture.isCompleted) {
      return NextResponse.json(
        { error: "Cannot update attendance for a completed lecture" },
        { status: 400 }
      );
    }

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to edit attendance" },
      { status: 500 }
    );
  }
}

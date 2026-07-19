export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attendanceId, sessionId } = body;

    if (!attendanceId || typeof attendanceId !== "number") {
      return NextResponse.json(
        { error: "attendanceId is required and must be a number" },
        { status: 400 }
      );
    }

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId is required and must be a string" },
        { status: 400 }
      );
    }

    const existing = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    if (existing.lockedBy && existing.lockedBy !== sessionId) {
      return NextResponse.json(
        { error: "Cannot unlock a student locked by another user" },
        { status: 403 }
      );
    }

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        lockedBy: null,
        lockedAt: null,
        lockedBySession: null,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to unlock student" },
      { status: 500 }
    );
  }
}

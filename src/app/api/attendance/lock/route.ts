export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LOCK_TIMEOUT_MS = 30 * 1000;

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
        { error: "Cannot lock a student in a completed lecture" },
        { status: 400 }
      );
    }

    if (existing.lockedBy && existing.lockedBy !== sessionId) {
      if (existing.lockedAt) {
        const elapsed = Date.now() - new Date(existing.lockedAt).getTime();
        if (elapsed < LOCK_TIMEOUT_MS) {
          return NextResponse.json(
            {
              error: "Student is locked by another user",
              lockedBy: existing.lockedBy,
              lockedAt: existing.lockedAt,
            },
            { status: 409 }
          );
        }
      }
    }

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        lockedBy: sessionId,
        lockedAt: new Date(),
        lockedBySession: sessionId,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to lock student" },
      { status: 500 }
    );
  }
}

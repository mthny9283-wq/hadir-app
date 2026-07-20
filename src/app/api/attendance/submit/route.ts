export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LOCK_TIMEOUT_MS = 30 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attendanceId, status, sessionId } = body;

    if (!attendanceId || typeof attendanceId !== "number") {
      return NextResponse.json(
        { error: "attendanceId is required and must be a number" },
        { status: 400 }
      );
    }

    if (!status || !["present", "absent", "pending", "guest"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'present', 'absent', 'pending', or 'guest'" },
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

    if (existing.lecture.isCompleted && existing.lecture.createdBy !== sessionId) {
      return NextResponse.json(
        { error: "Cannot update attendance for a completed lecture" },
        { status: 400 }
      );
    }

    if (existing.lockedBy && sessionId && existing.lockedBy !== sessionId) {
      if (existing.lockedAt) {
        const elapsed = Date.now() - new Date(existing.lockedAt).getTime();
        if (elapsed < LOCK_TIMEOUT_MS) {
          return NextResponse.json(
            {
              error: "Student is locked by another user",
              lockedBy: existing.lockedBy,
            },
            { status: 409 }
          );
        }
      }
    }

    if (existing.status !== "absent") {
      const lastAudit = await prisma.auditLog.findFirst({
        where: { attendanceId, action: "status_change" },
        orderBy: { performedAt: "desc" },
      });
      if (lastAudit && lastAudit.performedBy && lastAudit.performedBy !== sessionId) {
        return NextResponse.json(
          { error: "تم تسجيل هذا الطالب بالفعل من مستخدم آخر. قم بتحديث الصفحة لرؤية آخر التغييرات.", currentStatus: existing.status },
          { status: 409 }
        );
      }
    }

    const oldStatus = existing.status;

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status,
        lockedBy: null,
        lockedAt: null,
        lockedBySession: null,
      },
    });

    if (oldStatus !== status) {
      await prisma.auditLog.create({
        data: {
          lectureId: existing.lectureId,
          attendanceId,
          action: "status_change",
          oldStatus,
          newStatus: status,
          performedBy: sessionId || null,
        },
      });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to submit attendance" },
      { status: 500 }
    );
  }
}

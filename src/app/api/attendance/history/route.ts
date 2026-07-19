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
        auditLogs: {
          orderBy: { performedAt: "desc" },
          take: 5,
          select: {
            action: true,
            performedBy: true,
            performedAt: true,
          },
        },
        _count: {
          select: { auditLogs: true },
        },
      },
    });

    const result = lectures.map((lecture) => {
      const presentCount = lecture.attendance.filter((a) => a.status === "present").length;
      const absentCount = lecture.attendance.filter((a) => a.status === "absent").length;
      const guestCount = lecture.attendance.filter((a) => a.status === "guest").length;
      const pendingCount = lecture.attendance.filter((a) => a.status === "pending").length;
      const totalStudents = lecture.attendance.length;

      return {
        id: lecture.id,
        lectureNumber: lecture.lectureNumber,
        date: lecture.date,
        isCompleted: lecture.isCompleted,
        createdBy: lecture.createdBy,
        closedBy: lecture.closedBy,
        closedAt: lecture.closedAt,
        expiresAt: lecture.expiresAt,
        presentCount,
        absentCount,
        guestCount,
        pendingCount,
        totalStudents,
        auditCount: lecture._count.auditLogs,
        recentAudit: lecture.auditLogs.map((log) => ({
          action: log.action,
          performedBy: log.performedBy,
          performedAt: log.performedAt,
        })),
      };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch attendance history" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lectureId = searchParams.get("lectureId");

    if (!lectureId) {
      return NextResponse.json(
        { error: "lectureId query parameter is required" },
        { status: 400 }
      );
    }

    const lectureIdNum = parseInt(lectureId);

    if (isNaN(lectureIdNum)) {
      return NextResponse.json(
        { error: "lectureId must be a valid number" },
        { status: 400 }
      );
    }

    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureIdNum },
      select: {
        id: true,
        createdBy: true,
        closedBy: true,
        closedAt: true,
        createdAt: true,
      },
    });

    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: { lectureId: lectureIdNum },
      orderBy: { performedAt: "desc" },
      include: {
        attendance: {
          select: {
            student: {
              select: { name: true },
            },
          },
        },
      },
    });

    const result = auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      oldStatus: log.oldStatus,
      newStatus: log.newStatus,
      performedBy: log.performedBy,
      performedAt: log.performedAt,
      studentName: log.attendance?.student?.name || null,
    }));

    return NextResponse.json({
      lecture: {
        id: lecture.id,
        createdBy: lecture.createdBy,
        closedBy: lecture.closedBy,
        closedAt: lecture.closedAt,
        createdAt: lecture.createdAt,
      },
      auditLogs: result,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

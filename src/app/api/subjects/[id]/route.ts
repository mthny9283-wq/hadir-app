export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subjectId = parseInt(id);

    if (isNaN(subjectId)) {
      return NextResponse.json({ error: "Invalid subject ID" }, { status: 400 });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        lectures: {
          orderBy: { lectureNumber: "desc" },
          include: {
            attendance: {
              select: { status: true },
            },
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const studentsCount = await prisma.student.count();

    const totalLectures = subject.lectures.length;
    const completedLectures = subject.lectures.filter((l) => l.isCompleted);

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalGuest = 0;
    let totalPending = 0;
    let totalAttendanceRecords = 0;

    for (const lecture of subject.lectures) {
      for (const a of lecture.attendance) {
        totalAttendanceRecords++;
        if (a.status === "present") totalPresent++;
        else if (a.status === "absent") totalAbsent++;
        else if (a.status === "guest") totalGuest++;
        else if (a.status === "pending") totalPending++;
      }
    }

    const overallPercentage = totalAttendanceRecords > 0
      ? Math.round((totalPresent / totalAttendanceRecords) * 100)
      : 0;

    const lastLecture = subject.lectures.length > 0
      ? subject.lectures[0]
      : null;

    const subjectWithSummary = {
      id: subject.id,
      name: subject.name,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
      studentsCount,
      totalLectures,
      completedLectures: completedLectures.length,
      ongoingLectures: totalLectures - completedLectures.length,
      overallPercentage,
      totalPresent,
      totalAbsent,
      totalGuest,
      totalPending,
      lastLecture: lastLecture
        ? {
            id: lastLecture.id,
            lectureNumber: lastLecture.lectureNumber,
            date: lastLecture.date,
            isCompleted: lastLecture.isCompleted,
            createdBy: lastLecture.createdBy,
            closedBy: lastLecture.closedBy,
            closedAt: lastLecture.closedAt,
          }
        : null,
      lectures: subject.lectures.map((lecture) => ({
        id: lecture.id,
        lectureNumber: lecture.lectureNumber,
        date: lecture.date,
        isCompleted: lecture.isCompleted,
        createdBy: lecture.createdBy,
        closedBy: lecture.closedBy,
        closedAt: lecture.closedAt,
        expiresAt: lecture.expiresAt,
        presentCount: lecture.attendance.filter((a) => a.status === "present").length,
        absentCount: lecture.attendance.filter((a) => a.status === "absent").length,
        guestCount: lecture.attendance.filter((a) => a.status === "guest").length,
        pendingCount: lecture.attendance.filter((a) => a.status === "pending").length,
        totalStudents: lecture.attendance.length,
      })),
    };

    return NextResponse.json(subjectWithSummary);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch subject" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subjectId = parseInt(id);

    if (isNaN(subjectId)) {
      return NextResponse.json({ error: "Invalid subject ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.update({
      where: { id: subjectId },
      data: { name: name.trim() },
    });

    return NextResponse.json(subject);
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update subject" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subjectId = parseInt(id);

    if (isNaN(subjectId)) {
      return NextResponse.json({ error: "Invalid subject ID" }, { status: 400 });
    }

    await prisma.subject.delete({ where: { id: subjectId } });

    return NextResponse.json({ message: "Subject deleted successfully" });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 }
    );
  }
}

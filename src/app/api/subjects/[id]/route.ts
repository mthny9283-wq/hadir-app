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

    const subjectWithSummary = {
      ...subject,
      lectures: subject.lectures.map((lecture) => ({
        id: lecture.id,
        lectureNumber: lecture.lectureNumber,
        date: lecture.date,
        isCompleted: lecture.isCompleted,
        presentCount: lecture.attendance.filter((a) => a.status === "present").length,
        absentCount: lecture.attendance.filter((a) => a.status === "absent").length,
        totalStudents: lecture.attendance.length,
      })),
    };

    return NextResponse.json(subjectWithSummary);
  } catch (error) {
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
    if ((error as any).code === "P2025") {
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
    if ((error as any).code === "P2025") {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 }
    );
  }
}

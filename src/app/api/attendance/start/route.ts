export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LECTURE_DURATION_MS = 3 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subjectId, date, lectureNumber, sessionId } = body;

    if (!subjectId || typeof subjectId !== "number") {
      return NextResponse.json(
        { error: "subjectId is required and must be a number" },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    let nextLectureNumber: number;

    if (lectureNumber && typeof lectureNumber === "number" && lectureNumber > 0) {
      const existing = await prisma.lecture.findFirst({
        where: { subjectId, lectureNumber },
      });
      if (existing) {
        return NextResponse.json(
          { error: `المحاضرة رقم ${lectureNumber} موجودة مسبقاً` },
          { status: 400 }
        );
      }
      nextLectureNumber = lectureNumber;
    } else {
      const latestLecture = await prisma.lecture.findFirst({
        where: { subjectId },
        orderBy: { lectureNumber: "desc" },
      });
      nextLectureNumber = latestLecture ? latestLecture.lectureNumber + 1 : 1;
    }

    const lectureDate = date ? new Date(date) : new Date();
    const expiresAt = new Date(Date.now() + LECTURE_DURATION_MS);

    const result = await prisma.$transaction(async (tx) => {
      const lecture = await tx.lecture.create({
        data: {
          subjectId,
          lectureNumber: nextLectureNumber,
          date: lectureDate,
          isCompleted: false,
          createdBy: sessionId || null,
          expiresAt,
        },
      });

      const students = await tx.student.findMany({
        orderBy: { name: "asc" },
      });

      if (students.length > 0) {
        await tx.attendance.createMany({
          data: students.map((student) => ({
            lectureId: lecture.id,
            studentId: student.id,
            status: "absent",
          })),
        });
      }

      return { lecture, students };
    }, { timeout: 30000 });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error starting lecture:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start lecture" },
      { status: 500 }
    );
  }
}

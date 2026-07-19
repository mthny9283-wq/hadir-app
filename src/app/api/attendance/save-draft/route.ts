export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lectureId, sessionId, savedData, studentIndex } = body;

    if (!lectureId || typeof lectureId !== "number") {
      return NextResponse.json(
        { error: "lectureId is required and must be a number" },
        { status: 400 }
      );
    }

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId is required and must be a string" },
        { status: 400 }
      );
    }

    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
    });

    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    if (lecture.isCompleted) {
      return NextResponse.json(
        { error: "Cannot save draft for a completed lecture" },
        { status: 400 }
      );
    }

    const draft = await prisma.draftSession.upsert({
      where: {
        lectureId_sessionId: {
          lectureId,
          sessionId,
        },
      },
      update: {
        savedData: savedData || {},
        studentIndex: studentIndex || 0,
      },
      create: {
        lectureId,
        sessionId,
        savedData: savedData || {},
        studentIndex: studentIndex || 0,
      },
    });

    return NextResponse.json(draft, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save draft" },
      { status: 500 }
    );
  }
}

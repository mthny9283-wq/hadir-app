export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lectureId = searchParams.get("lectureId");
    const sessionId = searchParams.get("sessionId");

    if (!lectureId) {
      return NextResponse.json(
        { error: "lectureId query parameter is required" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId query parameter is required" },
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

    const draft = await prisma.draftSession.findUnique({
      where: {
        lectureId_sessionId: {
          lectureId: lectureIdNum,
          sessionId,
        },
      },
    });

    if (!draft) {
      return NextResponse.json({ draft: null }, { status: 200 });
    }

    return NextResponse.json({ draft }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to resume draft" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lectureId = searchParams.get("lectureId");
    const sessionId = searchParams.get("sessionId");

    if (!lectureId || !sessionId) {
      return NextResponse.json(
        { error: "lectureId and sessionId are required" },
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

    await prisma.draftSession.deleteMany({
      where: {
        lectureId: lectureIdNum,
        sessionId,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete draft" },
      { status: 500 }
    );
  }
}

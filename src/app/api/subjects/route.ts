export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where = search
      ? { name: { contains: search } }
      : {};

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: { name: "asc" },
      include: { _count: { select: { lectures: true } } },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data: { name: name.trim() },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create subject" },
      { status: 500 }
    );
  }
}

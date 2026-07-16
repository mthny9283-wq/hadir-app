export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeArabic(str: string): string {
  return str
    .normalize("NFKD")
    .replace(/[\u0610-\u061A\u06D6-\u06ED]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { names } = body;

    if (!Array.isArray(names)) {
      return NextResponse.json(
        { error: "names must be an array of strings" },
        { status: 400 }
      );
    }

    const validNames = names
      .filter((n): n is string => typeof n === "string" && n.trim().length > 0)
      .map((n) => normalizeArabic(n.trim()));

    const uniqueNames = [...new Set(validNames.map((n) => n.toLowerCase()))];

    const normalizedToOriginal = new Map<string, string>();
    for (const name of uniqueNames) {
      const original = validNames.find(
        (n) => normalizeArabic(n).toLowerCase() === name
      );
      if (original) normalizedToOriginal.set(name, original);
    }

    const existing = await prisma.student.findMany({
      where: { name: { in: Array.from(normalizedToOriginal.values()) } },
    });

    const existingLower = new Set(
      existing.map((s) => normalizeArabic(s.name).toLowerCase())
    );

    const newNames = uniqueNames
      .filter((n) => !existingLower.has(n))
      .map((n) => normalizedToOriginal.get(n) || n);

    const duplicates = validNames.length - newNames.length;

    if (newNames.length > 0) {
      await prisma.student.createMany({
        data: newNames.map((name) => ({ name })),
      });
    }

    return NextResponse.json({
      added: newNames.length,
      duplicates,
      total: names.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to import students" },
      { status: 500 }
    );
  }
}

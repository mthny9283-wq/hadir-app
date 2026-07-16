export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const result = await prisma.$transaction([
      prisma.attendance.deleteMany(),
      prisma.student.deleteMany(),
    ]);

    const deletedCount = result[1].count;

    return NextResponse.json({
      success: true,
      deletedStudents: deletedCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "فشل حذف جميع الطلاب" },
      { status: 500 }
    );
  }
}

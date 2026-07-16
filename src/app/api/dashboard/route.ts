export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalStudents, totalSubjects, totalLectures] = await Promise.all([
      prisma.student.count(),
      prisma.subject.count(),
      prisma.lecture.count(),
    ]);

    const latestLecture = await prisma.lecture.findFirst({
      orderBy: { createdAt: "desc" },
      include: { subject: { select: { name: true } } },
    });

    const recentActivities = await prisma.lecture.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { name: true } },
        attendance: { select: { status: true } },
      },
    });

    const activities = recentActivities.map((lecture) => ({
      id: lecture.id,
      subjectName: lecture.subject.name,
      lectureNumber: lecture.lectureNumber,
      date: lecture.date,
      isCompleted: lecture.isCompleted,
      presentCount: lecture.attendance.filter((a) => a.status === "present").length,
      absentCount: lecture.attendance.filter((a) => a.status === "absent").length,
      totalStudents: lecture.attendance.length,
    }));

    return NextResponse.json({
      totalStudents,
      totalSubjects,
      totalLectures,
      latestLecture,
      recentActivities: activities,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}

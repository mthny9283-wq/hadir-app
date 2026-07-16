import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usernameParam = searchParams.get("username");

    let userId: number | null = null;

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        userId = sessionData.userId;
      } catch {
        // invalid session — try username param instead
      }
    }

    if (!userId && usernameParam) {
      const user = await prisma.user.findUnique({
        where: { username: usernameParam.trim() },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json({ questions: [] });
      }
      userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const questions = await prisma.securityQuestion.findMany({
      where: { userId },
      select: {
        id: true,
        question: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ questions });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: "جلسة غير صالحة" }, { status: 401 });
    }

    const body = await request.json();
    const { question, answer } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { error: "يرجى إدخال السؤال والإجابة" },
        { status: 400 }
      );
    }

    if (question.length < 5) {
      return NextResponse.json(
        { error: "السؤال يجب أن يكون 5 أحرف على الأقل" },
        { status: 400 }
      );
    }

    if (answer.length < 2) {
      return NextResponse.json(
        { error: "الإجابة يجب أن تكون حرفين على الأقل" },
        { status: 400 }
      );
    }

    const existingCount = await prisma.securityQuestion.count({
      where: { userId: sessionData.userId },
    });

    if (existingCount >= 5) {
      return NextResponse.json(
        { error: "لا يمكن إضافة أكثر من 5 أسئلة أمان" },
        { status: 400 }
      );
    }

    const hashedAnswer = await bcrypt.hash(answer.toLowerCase().trim(), 10);

    const securityQuestion = await prisma.securityQuestion.create({
      data: {
        userId: sessionData.userId,
        question: question.trim(),
        answer: hashedAnswer,
      },
    });

    return NextResponse.json({
      success: true,
      question: {
        id: securityQuestion.id,
        question: securityQuestion.question,
        createdAt: securityQuestion.createdAt,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: "جلسة غير صالحة" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("id");

    if (!questionId) {
      return NextResponse.json(
        { error: "معرف السؤال مطلوب" },
        { status: 400 }
      );
    }

    const question = await prisma.securityQuestion.findFirst({
      where: {
        id: parseInt(questionId),
        userId: sessionData.userId,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "السؤال غير موجود" },
        { status: 404 }
      );
    }

    await prisma.securityQuestion.delete({
      where: { id: question.id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}

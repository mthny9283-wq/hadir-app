import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, questionId, answer, newPassword, verifyOnly } = body;

    if (!username || !questionId || !answer) {
      return NextResponse.json(
        { error: "يرجى ملء جميع الحقول" },
        { status: 400 }
      );
    }

    if (!verifyOnly && (!newPassword || newPassword.length < 6)) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { securityQuestions: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "اسم المستخدم غير موجود" },
        { status: 404 }
      );
    }

    if (user.securityQuestions.length === 0) {
      return NextResponse.json(
        { error: "لا توجد أسئلة أمان لهذا المستخدم" },
        { status: 400 }
      );
    }

    const question = user.securityQuestions.find(
      (q) => q.id === parseInt(questionId)
    );

    if (!question) {
      return NextResponse.json(
        { error: "السؤال غير موجود" },
        { status: 404 }
      );
    }

    const isAnswerValid = await bcrypt.compare(
      answer.toLowerCase().trim(),
      question.answer
    );

    if (!isAnswerValid) {
      return NextResponse.json(
        { error: "الإجابة غير صحيحة" },
        { status: 401 }
      );
    }

    if (verifyOnly) {
      return NextResponse.json({
        success: true,
        verified: true,
        message: "الإجابة صحيحة",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "تم إعادة تعيين كلمة المرور بنجاح",
    });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}

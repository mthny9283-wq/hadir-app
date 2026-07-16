import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, code, newPassword, verifyOnly } = body;

    if (!username || !code) {
      return NextResponse.json(
        { error: "يرجى إدخال اسم المستخدم والكود" },
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
    });

    if (!user) {
      return NextResponse.json(
        { error: "اسم المستخدم غير موجود" },
        { status: 404 }
      );
    }

    const resetCodes = await prisma.passwordResetCode.findMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (resetCodes.length === 0) {
      return NextResponse.json(
        { error: "لا يوجد كود إعادة تعيين صالح. يرجى طلب كود جديد من المدير" },
        { status: 400 }
      );
    }

    let matchedCode = null;
    for (const rc of resetCodes) {
      const isValid = await bcrypt.compare(code.toUpperCase().trim(), rc.code);
      if (isValid) {
        matchedCode = rc;
        break;
      }
    }

    if (!matchedCode) {
      return NextResponse.json(
        { error: "كود التحقق غير صحيح" },
        { status: 401 }
      );
    }

    if (verifyOnly) {
      return NextResponse.json({
        success: true,
        verified: true,
        message: "الكود صحيح",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetCode.update({
        where: { id: matchedCode.id },
        data: { used: true },
      }),
    ]);

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

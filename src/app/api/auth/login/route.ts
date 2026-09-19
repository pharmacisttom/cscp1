import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { signJwt } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกอีเมลและรหัสผ่าน" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        officer: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // Determine role (simplified, assume user has one role)
    const roleName = user.roles[0]?.role?.name || "VIEWER";
    let district = "ALL"; // Default for SSJ

    if (roleName === "DISTRICT_ADMIN" || roleName === "INSPECTOR") {
      district = user.officer?.district || "ปลวกแดง";
    }

    // Create JWT
    const token = await signJwt({
      userId: user.id,
      email: user.email,
      role: roleName,
      district,
    });

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        role: roleName,
        district,
      },
    });

    // Set cookie
    response.cookies.set("cscp_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

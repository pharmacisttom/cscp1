import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { signJwt } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    // Accept "identifier" which may be an email address OR a plain username
    // (e.g. "admintom" stored in the User.email field for login compatibility).
    // Also accept legacy field name "email" from the existing login page.
    const body = await req.json();
    const loginIdentifier: string = (body.identifier || body.email || "").trim();

    if (!loginIdentifier || !body.password) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 }
      );
    }

    const password: string = body.password;

    // Find user — identifier may be a plain username like "admintom" or a
    // full email address; both are stored in User.email for compatibility.
    const user = await prisma.user.findFirst({
      where: { email: loginIdentifier },
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
    const dbRoleName = user.roles[0]?.role?.name || "VIEWER";
    
    // Canonical mapping for legacy DB roles
    let roleName = dbRoleName;
    if (dbRoleName === "PROVINCE_ADMIN") roleName = "SUPER_ADMIN";
    if (dbRoleName === "DISTRICT_ADMIN") roleName = "DISTRICT_MANAGER";
    if (dbRoleName === "INSPECTOR_FIELD") roleName = "INSPECTOR";

    let district = "ALL"; // Default for SSJ

    if (roleName === "DISTRICT_MANAGER" || roleName === "INSPECTOR") {
      district = user.officer?.district || "ปลวกแดง";
    }

    // Create JWT
    const token = await signJwt({
      userId: user.id,
      organizationId: user.organizationId,
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
    // LAN/XAMPP is commonly served over plain HTTP. Marking the cookie Secure in
    // that environment makes browsers silently discard it and sends users back
    // to /login after a successful authentication.
    const forwardedProtocol = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const requestIsHttps = forwardedProtocol
      ? forwardedProtocol === "https"
      : new URL(req.url).protocol === "https:";

    response.cookies.set("cscp_session", token, {
      httpOnly: true,
      secure: requestIsHttps,
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

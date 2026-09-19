import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password"; // Used for future if needed
import * as argon2 from "argon2";

// GET: List all users and their roles
export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");

    // Only PROVINCE_ADMIN can view user list
    if (userRole !== "PROVINCE_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        officer: true,
        roles: {
          include: {
            role: true,
          },
        },
        organization: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      district: u.officer?.district || "N/A",
      role: u.roles[0]?.role?.name || "N/A",
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ success: true, data: formattedUsers });
  } catch (error: any) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST: Create a new district admin
export async function POST(request: NextRequest) {
  try {
    const userRoleHeader = request.headers.get("x-user-role");

    // Only PROVINCE_ADMIN can create users
    if (userRoleHeader !== "PROVINCE_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { email, password, firstName, lastName, district } = await request.json();

    if (!email || !password || !district) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const org = await prisma.organization.findFirst({
      where: { slug: "rayong-health" },
    });

    if (!org) {
      return NextResponse.json({ success: false, error: "Organization not found" }, { status: 500 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        organizationId_email: {
          organizationId: org.id,
          email,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: "อีเมล/บัญชีผู้ใช้งานนี้มีในระบบแล้ว" }, { status: 400 });
    }

    const distAdminRole = await prisma.role.findFirst({
      where: { name: "DISTRICT_ADMIN", organizationId: org.id },
    });

    if (!distAdminRole) {
      return NextResponse.json({ success: false, error: "DISTRICT_ADMIN role not found" }, { status: 500 });
    }

    const passwordHash = await argon2.hash(password);

    // Create User, Officer, and UserRole in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          email,
          passwordHash,
          firstName,
          lastName,
          displayName: `${firstName} ${lastName}`.trim(),
        },
      });

      await tx.officer.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          fullName: `${firstName} ${lastName}`.trim(),
          district,
        },
      });

      await tx.userRole.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          roleId: distAdminRole.id,
        },
      });

      return user;
    });

    return NextResponse.json({ success: true, message: "User created successfully", data: { id: newUser.id } });
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 });
  }
}

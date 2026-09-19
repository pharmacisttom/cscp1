import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as argon2 from "argon2";

// Helper to check auth
async function checkAuth(request: NextRequest) {
  const userRole = request.headers.get("x-user-role");
  if (userRole !== "PROVINCE_ADMIN") {
    return false;
  }
  return true;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await checkAuth(request);
    if (!isAuthed) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    const { id: userId } = await params;
    const body = await request.json();
    const { firstName, lastName, district, password } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { officer: true }
    });

    if (!existingUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Update user details
    const updateData: any = {
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`.trim(),
    };

    if (password && password.trim() !== "") {
      updateData.passwordHash = await argon2.hash(password);
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Update User table
      const user = await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      // 2. Update Officer table (district)
      if (existingUser.officer) {
        await tx.officer.update({
          where: { userId: userId },
          data: {
            fullName: updateData.displayName,
            district,
          }
        });
      } else {
        // Just in case officer doesn't exist, create it
        await tx.officer.create({
          data: {
            userId: userId,
            organizationId: existingUser.organizationId,
            fullName: updateData.displayName,
            district,
          }
        });
      }

      return user;
    });

    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await checkAuth(request);
    if (!isAuthed) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    const { id: userId } = await params;
    const currentUserId = request.headers.get("x-user-id");

    if (userId === currentUserId) {
      return NextResponse.json({ success: false, error: "Cannot delete yourself" }, { status: 400 });
    }

    // Delete everything in a transaction
    await prisma.$transaction(async (tx) => {
      // Prisma handles cascading deletes if configured in schema, but to be safe:
      await tx.userRole.deleteMany({ where: { userId } });
      await tx.officer.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 });
  }
}

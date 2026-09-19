import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { isSuperAdmin } from "@/lib/rbac";

/**
 * PUT /api/inspections/[id]/confidential
 *
 * Body: { action: "seal" | "unseal", reason: string, password: string }
 *
 * Seals or unseals an inspection record.
 * - Requires SUPER_ADMIN role
 * - Requires the caller's current session password for confirmation
 * - Records an AuditLog entry on every change
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get("x-user-role");
  const userId = request.headers.get("x-user-id");
  const orgId = request.headers.get("x-user-org-id");

  if (!isSuperAdmin(role)) {
    return NextResponse.json(
      { success: false, error: "เฉพาะ Super Admin เท่านั้นที่สามารถกำหนดระดับความลับได้" },
      { status: 403 }
    );
  }

  const { id: inspectionId } = await params;

  let body: { action?: string; reason?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const { action, reason, password } = body;

  // ── Validate input ─────────────────────────────────────────────────────────
  if (action !== "seal" && action !== "unseal") {
    return NextResponse.json(
      { success: false, error: "action ต้องเป็น 'seal' หรือ 'unseal'" },
      { status: 400 }
    );
  }
  if (!reason || reason.trim().length < 5) {
    return NextResponse.json(
      { success: false, error: "กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร" },
      { status: 400 }
    );
  }
  if (!password) {
    return NextResponse.json(
      { success: false, error: "กรุณาระบุรหัสผ่านของคุณเพื่อยืนยัน" },
      { status: 400 }
    );
  }

  // ── Verify caller's password ────────────────────────────────────────────────
  if (!userId) {
    return NextResponse.json({ success: false, error: "Session invalid" }, { status: 401 });
  }

  const callerUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!callerUser) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 401 });
  }

  const passwordValid = await verifyPassword(password, callerUser.passwordHash);
  if (!passwordValid) {
    return NextResponse.json(
      { success: false, error: "รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" },
      { status: 401 }
    );
  }

  // ── Find the inspection ────────────────────────────────────────────────────
  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
    include: { business: { select: { name: true } } },
  });

  if (!inspection) {
    return NextResponse.json(
      { success: false, error: "ไม่พบบันทึกการตรวจที่ระบุ" },
      { status: 404 }
    );
  }

  const newConfidential = action === "seal";

  // No-op if state is already what is requested
  if (inspection.isConfidential === newConfidential) {
    const stateLabel = newConfidential ? "ความลับ" : "เปิดเผย";
    return NextResponse.json({
      success: true,
      message: `บันทึกนี้อยู่ในสถานะ${stateLabel}อยู่แล้ว`,
      data: { id: inspectionId, isConfidential: newConfidential },
    });
  }

  // ── Update inspection ──────────────────────────────────────────────────────
  const updated = await prisma.inspection.update({
    where: { id: inspectionId },
    data: { isConfidential: newConfidential },
  });

  // ── AuditLog ───────────────────────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      organizationId: orgId || undefined,
      userId: userId || undefined,
      action: action === "seal" ? "CONFIDENTIAL_SEAL" : "CONFIDENTIAL_UNSEAL",
      tableName: "inspection",
      recordId: inspectionId,
      oldData: { isConfidential: inspection.isConfidential },
      newData: {
        isConfidential: newConfidential,
        reason: reason.trim(),
        businessName: inspection.business?.name,
        inspectionDate: inspection.inspectionDate,
      },
    },
  });

  const actionLabel = action === "seal" ? "ปกปิดเป็นความลับ" : "เปิดเผย";
  return NextResponse.json({
    success: true,
    message: `${actionLabel}บันทึกการตรวจสำเร็จ`,
    data: {
      id: updated.id,
      isConfidential: updated.isConfidential,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getDistrictAccessMatrix, saveDistrictAccessMatrix } from "@/lib/district-access";
import { normalizeDistrictAccess } from "@/lib/district-modules";
import { canManageUsers } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  if (!canManageUsers(request.headers.get("x-user-role"))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }
  return NextResponse.json({ success: true, data: await getDistrictAccessMatrix() });
}

export async function PUT(request: NextRequest) {
  if (!canManageUsers(request.headers.get("x-user-role"))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }
  const body = await request.json();
  const matrix = normalizeDistrictAccess(body?.data);
  await saveDistrictAccessMatrix(matrix);
  return NextResponse.json({ success: true, data: matrix });
}

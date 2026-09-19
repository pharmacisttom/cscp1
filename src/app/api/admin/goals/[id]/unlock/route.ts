import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/rbac";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = request.headers.get("x-user-org-id");
    const role = request.headers.get("x-user-role");
    
    if (!orgId || !isAdmin(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { newDeadline } = body;

    if (!newDeadline) {
      return NextResponse.json({ error: "Missing new deadline" }, { status: 400 });
    }

    const goal = await prisma.goal.update({
      where: { id, organizationId: orgId },
      data: {
        deadline: new Date(newDeadline),
        status: "ACTIVE"
      }
    });

    return NextResponse.json({ success: true, data: goal });
  } catch (error: any) {
    console.error("Goals Unlock Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

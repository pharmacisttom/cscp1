import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get("x-user-org-id");
    const district = request.headers.get("x-user-district") ? decodeURIComponent(request.headers.get("x-user-district") as string) : null;
    
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { officerId, businessIds, title, plannedDate } = body;

    if (!officerId || !businessIds || businessIds.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify officer belongs to this district/org
    const officer = await prisma.officer.findUnique({
      where: { id: officerId }
    });

    if (!officer || officer.organizationId !== orgId) {
      return NextResponse.json({ error: "Officer not found or unauthorized" }, { status: 403 });
    }

    // Create a new Inspection Plan for this officer
    const plan = await prisma.inspectionPlan.create({
      data: {
        organizationId: orgId,
        title: title || `มอบหมายงานตรวจ (${new Date().toLocaleDateString('th-TH')})`,
        plannedDate: plannedDate ? new Date(plannedDate) : startOfDay(new Date()),
        status: "PLANNED",
        officerId: officerId,
        stops: {
          create: businessIds.map((bid: string, index: number) => ({
            businessId: bid,
            stopOrder: index + 1,
            status: "PENDING"
          }))
        }
      },
      include: {
        stops: true
      }
    });

    return NextResponse.json({ success: true, data: plan });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

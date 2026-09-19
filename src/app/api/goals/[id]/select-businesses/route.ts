import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // districtGoalId
) {
  try {
    const orgId = request.headers.get("x-user-org-id");
    let district = request.headers.get("x-user-district");
    
    if (!orgId || !district) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    district = decodeURIComponent(district);

    const { id: districtGoalId } = await params;
    const body = await request.json();
    const { businessIds } = body; // Array of business IDs

    if (!Array.isArray(businessIds)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Check if the district goal belongs to this district
    const districtGoal = await prisma.districtGoal.findUnique({
      where: { id: districtGoalId },
      include: { goal: true }
    });

    if (!districtGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    if (districtGoal.district !== district) {
      return NextResponse.json({ error: "Unauthorized for this district" }, { status: 403 });
    }

    // Check Deadline
    const now = new Date();
    if (districtGoal.goal.deadline < now) {
      return NextResponse.json({ error: "Deadline has passed. Cannot modify targets." }, { status: 403 });
    }

    // Update targets
    // First, delete existing ones not in the new list, or just clear and recreate (easiest since no extra data)
    // Actually, if a business is already "INSPECTED", we shouldn't let them remove it.
    // For simplicity right now, we will just delete SELECTED ones and insert new ones.
    
    // Find businesses currently selected but NOT inspected
    await prisma.goalBusiness.deleteMany({
      where: {
        districtGoalId,
        status: "SELECTED",
      }
    });

    // We shouldn't delete INSPECTED ones. So we must filter out businessIds that are already INSPECTED,
    // and then insert the rest.
    const existingInspected = await prisma.goalBusiness.findMany({
      where: { districtGoalId, status: "INSPECTED" },
      select: { businessId: true }
    });

    const inspectedIds = existingInspected.map(g => g.businessId);
    
    const newIdsToInsert = businessIds.filter((bid: string) => !inspectedIds.includes(bid));

    if (newIdsToInsert.length > 0) {
      await prisma.goalBusiness.createMany({
        data: newIdsToInsert.map((bid: string) => ({
          districtGoalId,
          businessId: bid,
          status: "SELECTED"
        })),
        skipDuplicates: true
      });
    }

    // Update status of districtGoal if it reaches target count
    const finalCount = inspectedIds.length + newIdsToInsert.length;
    if (finalCount > 0) {
      await prisma.districtGoal.update({
        where: { id: districtGoalId },
        data: { status: "IN_PROGRESS" }
      });
    }

    return NextResponse.json({ success: true, count: finalCount });
  } catch (error: any) {
    console.error("Goals Select Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

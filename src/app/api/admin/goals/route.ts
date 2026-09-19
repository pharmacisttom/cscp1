import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all goals for Admin
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get("x-user-org-id");
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goals = await prisma.goal.findMany({
      where: { organizationId: orgId },
      include: {
        businessType: true,
        districtGoals: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: goals });
  } catch (error: any) {
    console.error("Goals GET Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST create a new goal and distribute to districts
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get("x-user-org-id");
    const userId = request.headers.get("x-user-id");
    
    if (!orgId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { title, description, fiscalYear, businessTypeId, deadline, targets } = body;

    // targets is an array: { district: string, targetCount: number }

    if (!title || !fiscalYear || !deadline || !targets || !Array.isArray(targets)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        organizationId: orgId,
        title,
        description,
        fiscalYear: Number(fiscalYear),
        businessTypeId: businessTypeId || null,
        deadline: new Date(deadline),
        createdById: userId,
        status: "ACTIVE",
        districtGoals: {
          create: targets.map((t: any) => ({
            district: t.district,
            targetCount: Number(t.targetCount),
            status: "PENDING"
          }))
        }
      },
      include: {
        districtGoals: true
      }
    });

    return NextResponse.json({ success: true, data: goal });
  } catch (error: any) {
    console.error("Goals POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

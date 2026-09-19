import { NextRequest, NextResponse } from "next/server";
import { canUseDistrictModuleFromHeaders } from "@/lib/district-access";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  if (!(await canUseDistrictModuleFromHeaders(request.headers, "kpis"))) {
    return NextResponse.json({ success: false, error: "โมดูล KPI ยังไม่เปิดใช้งานสำหรับอำเภอนี้" }, { status: 403 });
  }
  try {
    const orgId = request.headers.get("x-user-org-id");
    const role = request.headers.get("x-user-role");
    let district = request.headers.get("x-user-district");

    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (district) {
      district = decodeURIComponent(district);
    }

    if (isAdmin(role)) {
      // Province admin gets all goals
      const goals = await prisma.goal.findMany({
        where: { organizationId: orgId },
        include: {
          businessType: true,
          districtGoals: {
            include: {
              businesses: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json({ success: true, data: goals });
    }

    if (!district) {
      return NextResponse.json({ error: "Missing district header" }, { status: 400 });
    }

    // District user gets only their DistrictGoal but joined with the Goal
    const districtGoals = await prisma.districtGoal.findMany({
      where: {
        district: district,
        goal: {
          organizationId: orgId
        }
      },
      include: {
        goal: {
          include: {
            businessType: true
          }
        },
        businesses: {
          include: {
            business: {
              include: {
                location: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: districtGoals });
  } catch (error: any) {
    console.error("Goals GET Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

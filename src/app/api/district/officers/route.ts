import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get("x-user-org-id");
    let district = request.headers.get("x-user-district");
    
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (district) {
      district = decodeURIComponent(district);
    }

    if (!district || district === "undefined") {
      return NextResponse.json({ error: "District not found in user session" }, { status: 400 });
    }

    // Fetch all officers in this district
    const officers = await prisma.officer.findMany({
      where: {
        organizationId: orgId,
        district: district
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            roles: true,
            isActive: true
          }
        },
        _count: {
          select: {
            inspections: true,
            plansAssigned: {
              where: {
                status: {
                  notIn: ["COMPLETED", "CANCELLED"]
                }
              }
            }
          }
        }
      },
      orderBy: { fullName: 'asc' }
    });

    return NextResponse.json({ success: true, data: officers });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

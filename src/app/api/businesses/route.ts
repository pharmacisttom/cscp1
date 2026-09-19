import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get("x-user-org-id");
    let district = request.headers.get("x-user-district");
    
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (district) {
      district = decodeURIComponent(district);
    }

    const { searchParams } = new URL(request.url);
    const businessTypeId = searchParams.get("businessTypeId");
    const search = searchParams.get("search");

    const where: any = { organizationId: orgId };
    
    const userRole = request.headers.get("x-user-role");
    
    if (district && district !== "undefined" && !isAdmin(userRole)) {
      where.location = { district: district };
    }

    if (businessTypeId) {
      where.businessTypeId = businessTypeId;
    }

    if (search) {
      where.name = { contains: search };
    }

    const businesses = await prisma.business.findMany({
      where,
      include: {
        location: true,
        businessType: true
      },
      take: 50, // limit to 50 for quick selection
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ success: true, data: businesses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { canUseDistrictModuleFromHeaders } from "@/lib/district-access";
import { prisma } from "@/lib/prisma";
import {
  calculateCandidatePriority,
  DEFAULT_PRIORITY_WEIGHTS,
  InspectionCandidate,
} from "@/lib/planning/priority";
import {
  optimizeDailyInspectionRoute,
  RouteScenario,
} from "@/lib/planning/route-optimizer";
import { detectSpatialClusters } from "@/lib/epidemiology/clusters";

export async function GET(request: NextRequest) {
  if (!(await canUseDistrictModuleFromHeaders(request.headers, "smartPlans"))) {
    return NextResponse.json({ success: false, error: "โมดูลแผนตรวจอัจฉริยะยังไม่เปิดใช้งานสำหรับอำเภอนี้" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const scenario = (searchParams.get("scenario") || "BALANCED") as RouteScenario;
    const maxStops = searchParams.get("maxStops") ? parseInt(searchParams.get("maxStops")!, 10) : 6;
    const subdistrict = searchParams.get("subdistrict") || undefined;

    // RBAC Enforcement
    const userRole = request.headers.get("x-user-role");
    const rawDistrict = request.headers.get("x-user-district");
    const userDistrict = rawDistrict ? decodeURIComponent(rawDistrict) : null;
    
    let districtWhere: any = {};
    if (userRole === "DISTRICT_MANAGER" || userRole === "INSPECTOR") {
      districtWhere = { district: userDistrict || "ปลวกแดง" };
    }

    // 1. Fetch eligible candidates
    const businesses = await prisma.business.findMany({
      where: {
        location: {
          latitude: { not: null },
          longitude: { not: null },
          ...districtWhere,
          ...(subdistrict && subdistrict !== "ALL" ? { subdistrict } : {}),
        },
      },
      include: {
        businessType: true,
        location: true,
        complaints: {
          where: { status: "OPEN" },
        },
        licenses: {
          where: { status: "ACTIVE" },
        },
        inspections: {
          orderBy: { inspectionDate: "desc" },
          take: 1,
        },
      },
      take: 100,
    });

    // 2. Identify Hotspots
    const geoPoints = businesses.map((b) => ({
      id: b.id,
      name: b.name,
      lat: Number(b.location!.latitude),
      lng: Number(b.location!.longitude),
      riskScore: b.riskScore,
    }));

    const clusters = detectSpatialClusters(geoPoints, 0.8, 3);
    const hotspotIds = new Set<string>();
    clusters.forEach((c) => c.businessIds.forEach((id) => hotspotIds.add(id)));

    // 3. Stage 1: Candidate Scoring
    const candidates: InspectionCandidate[] = businesses.map((b) => {
      const isOverdue = b.inspectionStatus === "OVERDUE";
      const overdueDays = isOverdue ? 120 : 0;
      const hasOpenComplaint = b.complaints.length > 0;
      const isLicenseNearExpiry = b.licenses.some((l) => l.isNearExpiry);
      const requiresFollowup = b.inspectionStatus === "FOLLOWUP_REQUIRED";
      const inSpatialHotspot = hotspotIds.has(b.id);

      return {
        id: b.id,
        name: b.name,
        businessType: b.businessType.name,
        subdistrict: b.location?.subdistrict || "ปลวกแดง",
        latitude: b.location?.latitude ? Number(b.location.latitude) : null,
        longitude: b.location?.longitude ? Number(b.location.longitude) : null,
        riskScore: b.riskScore,
        riskLevel: b.riskLevel,
        isOverdue,
        overdueDays,
        hasOpenComplaint,
        isLicenseNearExpiry,
        requiresFollowup,
        inSpatialHotspot,
        openingHours: b.openingHours || "08:30 - 17:00",
        phone: b.phone || undefined,
      };
    });

    const scoredCandidates = candidates.map((c) =>
      calculateCandidatePriority(c, DEFAULT_PRIORITY_WEIGHTS)
    );

    // 4. Stage 2: Route Optimization
    const routeResult = optimizeDailyInspectionRoute(
      scoredCandidates,
      scenario,
      maxStops
    );

    return NextResponse.json({
      success: true,
      data: routeResult,
    });
  } catch (error: any) {
    console.error("GSIE Route Generation API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate route plan" },
      { status: 500 }
    );
  }
}

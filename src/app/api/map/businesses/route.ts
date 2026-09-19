import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let level = searchParams.get("level") || "district";
    let districtName = searchParams.get("districtName") || "ปลวกแดง";
    
    // RBAC Enforcement
    const userRole = request.headers.get("x-user-role");
    const rawDistrict = request.headers.get("x-user-district");
    const userDistrict = rawDistrict ? decodeURIComponent(rawDistrict) : null;

    if (userRole === "DISTRICT_ADMIN" || userRole === "INSPECTOR") {
      level = "district";
      districtName = userDistrict || "ปลวกแดง";
    }
    const minLat = searchParams.get("minLat") ? parseFloat(searchParams.get("minLat")!) : undefined;
    const maxLat = searchParams.get("maxLat") ? parseFloat(searchParams.get("maxLat")!) : undefined;
    const minLng = searchParams.get("minLng") ? parseFloat(searchParams.get("minLng")!) : undefined;
    const maxLng = searchParams.get("maxLng") ? parseFloat(searchParams.get("maxLng")!) : undefined;
    const type = searchParams.get("type");
    const subdistrict = searchParams.get("subdistrict");
    const riskLevel = searchParams.get("risk");
    const inspectionStatus = searchParams.get("status");
    const hasGpsOnly = searchParams.get("hasGps") !== "false";

    const where: any = {};

    if (type && type !== "ALL") {
      where.businessType = { name: type };
    }

    if (riskLevel && riskLevel !== "ALL") {
      where.riskLevel = riskLevel;
    }

    if (inspectionStatus && inspectionStatus !== "ALL") {
      where.inspectionStatus = inspectionStatus;
    }

    const locationWhere: any = {};
    
    if (level === "district") {
      locationWhere.district = districtName;
    }

    if (subdistrict && subdistrict !== "ALL") {
      locationWhere.subdistrict = subdistrict;
    }

    if (hasGpsOnly) {
      locationWhere.latitude = { not: null };
      locationWhere.longitude = { not: null };
    }

    if (minLat !== undefined && maxLat !== undefined && minLng !== undefined && maxLng !== undefined) {
      locationWhere.latitude = { gte: minLat, lte: maxLat };
      locationWhere.longitude = { gte: minLng, lte: maxLng };
    }

    if (Object.keys(locationWhere).length > 0) {
      where.location = locationWhere;
    }

    // Return lightweight payload for fast map rendering
    const businesses = await prisma.business.findMany({
      where,
      select: {
        id: true,
        name: true,
        riskScore: true,
        riskLevel: true,
        inspectionStatus: true,
        lastInspectionDate: true,
        nextInspectionDate: true,
        businessType: {
          select: { name: true, code: true, icon: true },
        },
        location: {
          select: {
            subdistrict: true,
            district: true,
            latitude: true,
            longitude: true,
            verified: true,
            coordinateSource: true,
          },
        },
        licenses: {
          where: { status: "ACTIVE" },
          select: { licenseNo: true, expireDate: true, isNearExpiry: true },
          take: 1,
        },
        complaints: {
          where: { status: "OPEN" },
          select: { id: true, severity: true },
        },
      },
      take: 2000,
    });

    const markers = businesses.map((b) => ({
      id: b.id,
      name: b.name,
      lat: b.location?.latitude ? Number(b.location.latitude) : null,
      lng: b.location?.longitude ? Number(b.location.longitude) : null,
      subdistrict: b.location?.subdistrict || "ไม่ระบุตำบล",
      district: b.location?.district || "ไม่ระบุอำเภอ",
      type: b.businessType.name,
      typeCode: b.businessType.code,
      typeIcon: b.businessType.icon,
      riskScore: b.riskScore,
      riskLevel: b.riskLevel,
      status: b.inspectionStatus,
      licenseNo: b.licenses[0]?.licenseNo || "ไม่มีข้อมูล",
      isNearExpiry: b.licenses[0]?.isNearExpiry || false,
      hasOpenComplaint: b.complaints.length > 0,
      verifiedGps: b.location?.verified || false,
      lastInspection: b.lastInspectionDate ? b.lastInspectionDate.toISOString().split("T")[0] : null,
      nextInspection: b.nextInspectionDate ? b.nextInspectionDate.toISOString().split("T")[0] : null,
    }));

    return NextResponse.json({
      success: true,
      total: markers.length,
      data: markers,
    });
  } catch (error: any) {
    console.error("Map businesses API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch map businesses" },
      { status: 500 }
    );
  }
}

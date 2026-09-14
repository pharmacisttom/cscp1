import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, latitude, longitude, accuracy, officerId } = body;

    if (!businessId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required coordinates or business ID" },
        { status: 400 }
      );
    }

    const updatedLocation = await prisma.businessLocation.update({
      where: { businessId },
      data: {
        latitude,
        longitude,
        coordinateAccuracy: accuracy || null,
        coordinateSource: "VERIFIED_GPS",
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: officerId || "INSPECTOR_FIELD",
        geocodeStatus: "SUCCESS",
      },
    });

    // Resolve any MISSING_GPS data quality issue
    await prisma.dataQualityIssue.updateMany({
      where: {
        businessId,
        issueType: "MISSING_GPS",
        resolved: false,
      },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: officerId || "INSPECTOR_FIELD",
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: "COORDINATE_CHANGED",
        tableName: "businesslocation",
        recordId: updatedLocation.id,
        newData: {
          latitude,
          longitude,
          accuracy,
          source: "VERIFIED_GPS",
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "ยืนยันพิกัดสถานประกอบการเรียบร้อยแล้ว",
      data: updatedLocation,
    });
  } catch (error: any) {
    console.error("GPS verify API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify location" },
      { status: 500 }
    );
  }
}

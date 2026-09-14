import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        businessType: true,
        location: true,
        licenses: true,
        images: true,
        documents: true,
        inspections: {
          orderBy: { inspectionDate: "desc" },
          take: 5,
          include: {
            findings: true,
            officer: true,
            attachments: true,
          },
        },
        complaints: {
          orderBy: { complaintDate: "desc" },
          take: 5,
        },
        riskSnapshots: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 }
      );
    }

    const latestRiskSnapshot = business.riskSnapshots[0];

    return NextResponse.json({
      success: true,
      data: {
        id: business.id,
        name: business.name,
        businessType: business.businessType.name,
        baseRisk: business.businessType.baseRisk,
        status: business.status,
        inspectionStatus: business.inspectionStatus,
        riskScore: business.riskScore,
        riskLevel: business.riskLevel,
        riskBreakdown: latestRiskSnapshot?.factorBreakdown || [],
        phone: business.phone,
        openingHours: business.openingHours,
        wasteManagement: business.wasteManagement,
        medicalEquipment: business.medicalEquipment,
        notes: business.notes,
        location: business.location
          ? {
              address: business.location.address,
              subdistrict: business.location.subdistrict,
              district: business.location.district,
              province: business.location.province,
              latitude: business.location.latitude ? Number(business.location.latitude) : null,
              longitude: business.location.longitude ? Number(business.location.longitude) : null,
              verified: business.location.verified,
              coordinateSource: business.location.coordinateSource,
              accuracy: business.location.coordinateAccuracy,
            }
          : null,
        licenses: business.licenses.map((l) => ({
          licenseNo: l.licenseNo,
          oldLicenseNo: l.oldLicenseNo,
          licenseeName: l.licenseeName,
          operatorName: l.operatorName,
          expireYearText: l.expireYearText,
          status: l.status,
          isNearExpiry: l.isNearExpiry,
        })),
        images: business.images.map((img) => ({
          id: img.id,
          url: img.imageUrl,
          category: img.category,
        })),
        inspections: business.inspections.map((ins) => ({
          id: ins.id,
          date: ins.inspectionDate.toISOString().split("T")[0],
          type: ins.inspectionType,
          inspector: ins.inspectorName || ins.officer?.fullName || "เจ้าหน้าที่",
          result: ins.result,
          score: ins.score,
          problemFound: ins.problemFound,
          recommendation: ins.recommendation,
          findings: ins.findings.map((f) => ({
            id: f.id,
            category: f.category,
            description: f.description,
            isCritical: f.isCritical,
          })),
          attachments: ins.attachments.map((att) => ({
            id: att.id,
            fileUrl: att.fileUrl,
            fileName: att.fileName,
            fileType: att.fileType,
            fileSize: att.fileSize,
            caption: att.caption,
          })),
        })),
        complaints: business.complaints.map((c) => ({
          id: c.id,
          date: c.complaintDate.toISOString().split("T")[0],
          topic: c.topic,
          detail: c.detail,
          severity: c.severity,
          status: c.status,
        })),
      },
    });
  } catch (error: any) {
    console.error("Fetch business detail error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch details" },
      { status: 500 }
    );
  }
}

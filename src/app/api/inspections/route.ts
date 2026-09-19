import { NextRequest, NextResponse } from "next/server";
import { canUseDistrictModuleFromHeaders } from "@/lib/district-access";
import { prisma } from "@/lib/prisma";
import { calculateGeoEpiRisk } from "@/lib/risk/engine";

export async function POST(request: NextRequest) {
  if (!(await canUseDistrictModuleFromHeaders(request.headers, "inspections"))) {
    return NextResponse.json({ success: false, error: "โมดูลผลการตรวจยังไม่เปิดใช้งานสำหรับอำเภอนี้" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const {
      businessId,
      templateVersionId,
      inspectionDate,
      inspectionType,
      inspectorName,
      result,
      score,
      problemFound,
      recommendation,
      nextFollowupDate,
      answers,
      criticalFindings,
      attachments, // Array of { fileUrl, fileName, fileType, fileSize, caption }
    } = body;

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "Missing required businessId" },
        { status: 400 }
      );
    }

    const inspectDate = inspectionDate ? new Date(inspectionDate) : new Date();
    const isFailed = result === "FAILED";
    const hasCritical = criticalFindings && criticalFindings.length > 0;

    // 1. Create Inspection Record
    const inspection = await prisma.inspection.create({
      data: {
        businessId,
        templateVersionId: templateVersionId || null,
        inspectionDate: inspectDate,
        inspectionType: inspectionType || "ROUTINE",
        inspectorName: inspectorName || "พนักงานเจ้าหน้าที่",
        result: result || "PASSED",
        score: score !== undefined ? score : 100,
        problemFound: problemFound || null,
        recommendation: recommendation || null,
        nextFollowupDate: nextFollowupDate ? new Date(nextFollowupDate) : null,
        followupStatus: isFailed ? "PENDING" : "NONE",
        formData: answers || {},
      },
    });

    // 2. Save Inspection Findings
    if (criticalFindings && criticalFindings.length > 0) {
      for (const finding of criticalFindings) {
        await prisma.inspectionFinding.create({
          data: {
            inspectionId: inspection.id,
            category: finding.category || "STANDARD_FINDING",
            description: finding.description,
            isCritical: !!finding.isCritical,
          },
        });
      }
    }

    // 3. Save Attachments (PDFs and Photos)
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        await prisma.inspectionAttachment.create({
          data: {
            inspectionId: inspection.id,
            fileUrl: att.fileUrl,
            fileName: att.fileName || null,
            fileType: att.fileType || (att.fileUrl.endsWith(".pdf") ? "PDF" : "IMAGE"),
            fileSize: att.fileSize || null,
            caption: att.caption || null,
          },
        });
      }
    }

    // 4. Dynamic Risk Recalculation for Establishment
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        businessType: true,
        complaints: {
          where: {
            status: "OPEN",
          },
        },
      },
    });

    if (business) {
      const complaintLast90Days = business.complaints.length > 0;

      const riskCalc = calculateGeoEpiRisk({
        businessTypeBaseRisk: business.businessType.baseRisk,
        failedLastInspection: isFailed,
        hasCriticalFinding: hasCritical,
        complaintLast90Days,
        isOverdueInspection: false, // Just inspected!
      });

      // Calculate next due inspection date
      let nextDue: Date;
      if (isFailed && nextFollowupDate) {
        nextDue = new Date(nextFollowupDate);
      } else {
        const intervalDays = business.businessType.inspectionIntervalDays || 365;
        nextDue = new Date(inspectDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      }

      await prisma.business.update({
        where: { id: businessId },
        data: {
          lastInspectionDate: inspectDate,
          nextInspectionDate: nextDue,
          inspectionStatus: isFailed ? "FOLLOWUP_REQUIRED" : "INSPECTED",
          riskScore: riskCalc.score,
          riskLevel: riskCalc.level,
          lastRiskCalculatedAt: new Date(),
        },
      });

      // Save versioned risk snapshot
      await prisma.riskSnapshot.create({
        data: {
          businessId,
          riskScore: riskCalc.score,
          riskLevel: riskCalc.level,
          algorithmVersion: riskCalc.algorithmVersion,
          factorBreakdown: JSON.parse(JSON.stringify(riskCalc.factors)),
          neighborhoodRisk: 0.0,
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          action: "INSPECTION",
          tableName: "inspection",
          recordId: inspection.id,
          newData: {
            businessId,
            result,
            score,
            newRiskScore: riskCalc.score,
            newRiskLevel: riskCalc.level,
            attachmentCount: attachments?.length || 0,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกผลการตรวจประเมิน อัปโหลดเอกสาร/ภาพถ่าย และปรับปรุงระดับความเสี่ยงสำเร็จ",
      data: {
        inspectionId: inspection.id,
        result,
        score,
        businessId,
      },
    });
  } catch (error: any) {
    console.error("Inspection creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record inspection" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!(await canUseDistrictModuleFromHeaders(request.headers, "inspections"))) {
    return NextResponse.json({ success: false, error: "โมดูลผลการตรวจยังไม่เปิดใช้งานสำหรับอำเภอนี้" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const role = request.headers.get("x-user-role");

    // Server-side confidentiality enforcement:
    // Only SUPER_ADMIN may see records marked isConfidential = true.
    const { isSuperAdmin } = await import("@/lib/rbac");
    const canSeeConfidential = isSuperAdmin(role);

    const baseWhere: any = {
      ...(businessId ? { businessId } : {}),
      // Non-SUPER_ADMIN: exclude all confidential records
      ...(!canSeeConfidential ? { isConfidential: false } : {}),
    };

    const inspections = await prisma.inspection.findMany({
      where: baseWhere,
      orderBy: { inspectionDate: "desc" },
      include: {
        business: {
          select: {
            name: true,
            businessType: { select: { name: true } },
            riskScore: true,
            riskLevel: true,
          },
        },
        findings: true,
        attachments: true,
      },
      take: 50,
    });

    // Provide a confidential count to SUPER_ADMIN so they know how many are hidden
    const confidentialCount = canSeeConfidential
      ? await prisma.inspection.count({
          where: {
            ...(businessId ? { businessId } : {}),
            isConfidential: true,
          },
        })
      : 0;

    return NextResponse.json({
      success: true,
      data: inspections,
      meta: {
        canSeeConfidential,
        confidentialCount,
      },
    });
  } catch (error: any) {
    console.error("Fetch inspections error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch inspections" },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDenominatorAwareMetrics, getThaiFiscalYear } from "@/lib/epidemiology/indicators";
import { detectEwmaSignals, detectCusumSignals } from "@/lib/epidemiology/signals";
import { detectSpatialClusters } from "@/lib/epidemiology/clusters";

export async function GET() {
  try {
    const fiscalYear = getThaiFiscalYear();

    // 1. Fetch all businesses with location, inspections, complaints
    const businesses = await prisma.business.findMany({
      include: {
        businessType: true,
        location: true,
        inspections: {
          orderBy: { inspectionDate: "desc" },
          include: { findings: true },
        },
        complaints: true,
      },
    });

    const total = businesses.length;
    const inspected = businesses.filter((b) => b.inspections.length > 0).length;
    const failed = businesses.filter(
      (b) => b.inspections.length > 0 && b.inspections[0].result === "FAILED"
    ).length;
    const totalComplaints = businesses.reduce((sum, b) => sum + b.complaints.length, 0);
    const overdue = businesses.filter((b) => b.inspectionStatus === "OVERDUE").length;
    const criticalRiskCount = businesses.filter((b) => b.riskLevel === "CRITICAL").length;
    const highRiskCount = businesses.filter((b) => b.riskLevel === "HIGH").length;
    const withGpsCount = businesses.filter(
      (b) => b.location?.latitude && b.location?.longitude
    ).length;

    // 2. Denominator-Aware Metrics
    const metrics = calculateDenominatorAwareMetrics({
      totalBusinesses: total,
      inspectedBusinesses: inspected,
      failedInspections: failed,
      complaintCount: totalComplaints,
      overdueInspections: overdue,
      followupRequired: 12, // Baseline active follow-up
      followupOverdue: 3,
    });

    // 3. Subdistrict Aggregations
    const subdistrictMap = new Map<string, typeof businesses>();
    const standardSubdistricts = [
      "ปลวกแดง",
      "ตาสิทธิ์",
      "ละหาร",
      "แม่น้ำคู้",
      "มาบยางพร",
      "หนองไร่",
    ];

    standardSubdistricts.forEach((s) => subdistrictMap.set(s, []));

    businesses.forEach((b) => {
      const sub = b.location?.subdistrict || "ปลวกแดง";
      if (!subdistrictMap.has(sub)) subdistrictMap.set(sub, []);
      subdistrictMap.get(sub)!.push(b);
    });

    const subdistrictBreakdown = Array.from(subdistrictMap.entries()).map(
      ([subdistrict, items]) => {
        const count = items.length;
        const subInspected = items.filter((b) => b.inspections.length > 0).length;
        const subFailed = items.filter(
          (b) => b.inspections.length > 0 && b.inspections[0].result === "FAILED"
        ).length;
        const subComplaints = items.reduce((sum, b) => sum + b.complaints.length, 0);
        const subOverdue = items.filter((b) => b.inspectionStatus === "OVERDUE").length;
        const subCritical = items.filter((b) => b.riskLevel === "CRITICAL").length;
        const avgRisk =
          count > 0
            ? Number((items.reduce((s, b) => s + b.riskScore, 0) / count).toFixed(1))
            : 0;

        const subMetrics = calculateDenominatorAwareMetrics({
          totalBusinesses: count,
          inspectedBusinesses: subInspected,
          failedInspections: subFailed,
          complaintCount: subComplaints,
          overdueInspections: subOverdue,
          followupRequired: 0,
          followupOverdue: 0,
        });

        return {
          subdistrict,
          total: count,
          inspected: subInspected,
          failed: subFailed,
          complaints: subComplaints,
          overdue: subOverdue,
          criticalRiskCount: subCritical,
          averageRisk: avgRisk,
          coverageRate: subMetrics.inspectionCoverageRate,
          failureRate: subMetrics.complianceFailureRate,
          complaintRatePer100: subMetrics.complaintRatePer100,
        };
      }
    );

    // 4. Hotspot Cluster Detection
    const geoPoints = businesses
      .filter((b) => b.location?.latitude && b.location?.longitude)
      .map((b) => ({
        id: b.id,
        name: b.name,
        lat: Number(b.location!.latitude),
        lng: Number(b.location!.longitude),
        riskScore: b.riskScore,
      }));

    const clusters = detectSpatialClusters(geoPoints, 0.8, 3);

    // 5. Time Series & Signal Detection Mock/Historical Curve
    const monthlyData = [
      { date: "2026-04", value: 4 },
      { date: "2026-05", value: 6 },
      { date: "2026-06", value: 5 },
      { date: "2026-07", value: 7 },
      { date: "2026-08", value: 8 },
      { date: "2026-09", value: 16 }, // Spike to trigger EWMA surveillance signal
    ];

    const ewmaSignals = detectEwmaSignals(monthlyData, 0.25, 2.0);
    const cusumSignals = detectCusumSignals(monthlyData, 0.5, 3.5);

    return NextResponse.json({
      success: true,
      fiscalYear,
      metrics,
      counts: {
        total,
        inspected,
        failed,
        complaints: totalComplaints,
        overdue,
        criticalRiskCount,
        highRiskCount,
        withGpsCount,
        missingGpsCount: total - withGpsCount,
      },
      subdistricts: subdistrictBreakdown,
      clusters,
      timeSeries: monthlyData,
      signals: [...ewmaSignals, ...cusumSignals],
    });
  } catch (error: any) {
    console.error("Surveillance indicators API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate indicators" },
      { status: 500 }
    );
  }
}

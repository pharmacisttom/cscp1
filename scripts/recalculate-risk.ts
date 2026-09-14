import { prisma } from "../src/lib/prisma";
import { calculateGeoEpiRisk } from "../src/lib/risk/engine";
import { detectSpatialClusters } from "../src/lib/epidemiology/clusters";

async function recalculateAllRisks() {
  console.log("⚡ Recalculating GeoEpi Risk for All Establishments...");

  const businesses = await prisma.business.findMany({
    include: {
      businessType: true,
      location: true,
      complaints: {
        where: {
          complaintDate: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // last 90 days
          },
        },
      },
      inspections: {
        orderBy: { inspectionDate: "desc" },
        take: 1,
        include: { findings: true },
      },
      licenses: {
        where: { status: "ACTIVE" },
      },
    },
  });

  console.log(`Processing ${businesses.length} establishments...`);

  // 1. Gather geo points for spatial clustering
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
  const hotspotBusinessIds = new Set<string>();
  clusters.forEach((c) => c.businessIds.forEach((id) => hotspotBusinessIds.add(id)));

  console.log(`Detected ${clusters.length} spatial clusters/hotspots (${hotspotBusinessIds.size} businesses in hotspots).`);

  let updated = 0;
  for (const b of businesses) {
    const lastInspection = b.inspections[0];
    const failedLastInspection = lastInspection?.result === "FAILED";
    const hasCriticalFinding = lastInspection?.findings.some((f) => f.isCritical) ?? false;
    const complaintLast90Days = b.complaints.length > 0;
    const inSpatialHotspot = hotspotBusinessIds.has(b.id);
    const missingOrInvalidGps = !b.location?.latitude || !b.location?.longitude;

    // Check overdue (if last inspection > 365 days or never inspected)
    let isOverdue = false;
    let overdueDays = 0;
    if (b.lastInspectionDate) {
      const daysSince = Math.floor(
        (Date.now() - new Date(b.lastInspectionDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince > (b.businessType.inspectionIntervalDays || 365)) {
        isOverdue = true;
        overdueDays = daysSince - (b.businessType.inspectionIntervalDays || 365);
      }
    } else {
      isOverdue = true;
      overdueDays = 180; // default benchmark for never inspected
    }

    const riskResult = calculateGeoEpiRisk({
      businessTypeBaseRisk: b.businessType.baseRisk,
      failedLastInspection,
      hasCriticalFinding,
      complaintLast90Days,
      isOverdueInspection: isOverdue,
      overdueDays,
      inSpatialHotspot,
      missingOrInvalidGps,
    });

    await prisma.business.update({
      where: { id: b.id },
      data: {
        riskScore: riskResult.score,
        riskLevel: riskResult.level,
        lastRiskCalculatedAt: new Date(),
        inspectionStatus: isOverdue ? "OVERDUE" : b.inspectionStatus,
      },
    });

    await prisma.riskSnapshot.create({
      data: {
        businessId: b.id,
        riskScore: riskResult.score,
        riskLevel: riskResult.level,
        algorithmVersion: riskResult.algorithmVersion,
        factorBreakdown: JSON.parse(JSON.stringify(riskResult.factors)),
        neighborhoodRisk: inSpatialHotspot ? 8.0 : 0.0,
      },
    });

    updated++;
  }

  console.log(`✅ Risk recalculation completed for ${updated} establishments.`);
}

recalculateAllRisks()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

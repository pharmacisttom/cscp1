/**
 * Automated Verification Test Suite for CSCP GeoEpi Core Engines
 */

import { parseCoordinates } from "../src/lib/maps/coordinates";
import { haversineDistanceKm, estimateTravelMinutes } from "../src/lib/maps/distance";
import { calculateGeoEpiRisk } from "../src/lib/risk/engine";
import {
  calculateDenominatorAwareMetrics,
  getThaiFiscalYear,
  getFiscalYearDateRange,
} from "../src/lib/epidemiology/indicators";
import { detectEwmaSignals, detectCusumSignals } from "../src/lib/epidemiology/signals";
import { detectSpatialClusters } from "../src/lib/epidemiology/clusters";
import { calculateCandidatePriority } from "../src/lib/planning/priority";
import { optimizeDailyInspectionRoute } from "../src/lib/planning/route-optimizer";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTestSuite() {
  console.log("🧪 STARTING CSCP GeoEpi AUTOMATED ENGINE TESTS\n");

  // 1. Coordinates Parser Test
  console.log("1. Testing Coordinates Parser & Bounds:");
  const c1 = parseCoordinates("12.9754, 101.2154");
  assert(c1.isValid && c1.latitude === 12.9754 && c1.longitude === 101.2154, "Parse valid comma-separated coordinates");

  const c2 = parseCoordinates("lat: 12.9754000 lon: 101.2154000");
  assert(c2.isValid, "Parse coordinates with labels");

  const c3 = parseCoordinates("");
  assert(!c3.isValid, "Properly flag empty coordinates as invalid");

  const c4 = parseCoordinates("45.123, 10.456"); // Outside Thailand
  assert(!c4.isValid, "Properly flag out-of-Thailand coordinates as invalid");

  // 2. Haversine Distance & Travel Time Test
  console.log("\n2. Testing Haversine Distance & Travel Time:");
  // Bangkok to Rayong ~140km
  const dist = haversineDistanceKm(13.7563, 100.5018, 12.6814, 101.2816);
  assert(dist > 130 && dist < 170, `Distance calculation within expected range: ${dist} km`);

  const localDist = haversineDistanceKm(12.9754, 101.2154, 12.9854, 101.2254);
  assert(localDist > 1.0 && localDist < 2.5, `Short district distance accurate: ${localDist} km`);

  const travelMins = estimateTravelMinutes(10, 40);
  assert(travelMins >= 15 && travelMins <= 20, `Travel time realistic: ${travelMins} mins for 10km`);

  // 3. Explainable Risk Engine Test
  console.log("\n3. Testing GeoEpi Risk Engine (GEOEPI-RISK-1.0):");
  const lowRisk = calculateGeoEpiRisk({ businessTypeBaseRisk: 15 });
  assert(lowRisk.level === "LOW" && lowRisk.score === 15, "Baseline risk calculation correct");

  const criticalRisk = calculateGeoEpiRisk({
    businessTypeBaseRisk: 25,
    failedLastInspection: true,
    hasCriticalFinding: true,
    complaintLast90Days: true,
    isOverdueInspection: true,
    overdueDays: 120,
    inSpatialHotspot: true,
  });
  assert(criticalRisk.level === "CRITICAL" && criticalRisk.score >= 80, `Critical risk detection: ${criticalRisk.score}/100`);
  assert(criticalRisk.factors.length >= 6, "Transparent explainable factors provided");

  // 4. Denominator-Aware Indicators Test
  console.log("\n4. Testing Denominator-Aware Epidemiology Rates:");
  const metrics = calculateDenominatorAwareMetrics({
    totalBusinesses: 200,
    inspectedBusinesses: 100,
    failedInspections: 10,
    complaintCount: 15,
    overdueInspections: 25,
    followupRequired: 10,
    followupOverdue: 2,
  });
  assert(metrics.inspectionCoverageRate === 50.0, "Coverage rate is exactly 50%");
  assert(metrics.complianceFailureRate === 10.0, "Failure rate is exactly 10%");
  assert(metrics.complaintRatePer100 === 7.5, "Complaint rate is 7.5 per 100");

  // Safe zero division test
  const safeZero = calculateDenominatorAwareMetrics({
    totalBusinesses: 0,
    inspectedBusinesses: 0,
    failedInspections: 0,
    complaintCount: 0,
    overdueInspections: 0,
    followupRequired: 0,
    followupOverdue: 0,
  });
  assert(safeZero.inspectionCoverageRate === 0 && !isNaN(safeZero.inspectionCoverageRate), "Zero-division safe");

  // 5. Thai Fiscal Year Test
  console.log("\n5. Testing Thai Fiscal Year Conversion:");
  const octDate = new Date("2026-10-15"); // October -> next fiscal year (2026 + 544 = 2570)
  assert(getThaiFiscalYear(octDate) === 2570, "October maps to next fiscal year");

  const sepDate = new Date("2026-09-15"); // September -> current fiscal year (2026 + 543 = 2569)
  assert(getThaiFiscalYear(sepDate) === 2569, "September maps to current fiscal year");

  // 6. Temporal Signal Detection (EWMA / CUSUM)
  console.log("\n6. Testing Surveillance Signal Detection (EWMA & CUSUM):");
  const timeSeries = [
    { date: "2026-01", value: 2 },
    { date: "2026-02", value: 3 },
    { date: "2026-03", value: 3 },
    { date: "2026-04", value: 7 },
    { date: "2026-05", value: 10 },
    { date: "2026-06", value: 16 },
  ];
  const ewmaSignals = detectEwmaSignals(timeSeries, 0.25, 1.8);
  assert(ewmaSignals.length > 0, "EWMA detected abnormal surveillance spike");

  const cusumSignals = detectCusumSignals(timeSeries, 0.3, 1.5);
  assert(cusumSignals.length > 0, "CUSUM detected cumulative problem accumulation");

  // 7. DBSCAN Spatial Cluster Test
  console.log("\n7. Testing DBSCAN Spatial Clustering:");
  const testPoints = [
    { id: "1", name: "A", lat: 12.975, lng: 101.215, riskScore: 80 },
    { id: "2", name: "B", lat: 12.976, lng: 101.216, riskScore: 75 },
    { id: "3", name: "C", lat: 12.974, lng: 101.214, riskScore: 70 },
    { id: "4", name: "Far", lat: 12.800, lng: 101.000, riskScore: 20 },
  ];
  const clusters = detectSpatialClusters(testPoints, 0.8, 3);
  assert(clusters.length === 1, "DBSCAN correctly grouped 3 nearby points and excluded outlier");
  assert(clusters[0].businessCount === 3, "Cluster contains exactly 3 businesses");

  // 8. Smart Inspection Engine GSIE & 2-opt Test
  console.log("\n8. Testing GSIE Priority Engine & Route Optimization (2-opt):");
  const scoredCandidate = calculateCandidatePriority({
    id: "test-1",
    name: "คลินิกทดสอบ",
    businessType: "คลินิก / สถานพยาบาล",
    subdistrict: "ปลวกแดง",
    latitude: 12.9854,
    longitude: 101.2254,
    riskScore: 85,
    riskLevel: "CRITICAL",
    isOverdue: true,
    overdueDays: 90,
    hasOpenComplaint: true,
    isLicenseNearExpiry: false,
    requiresFollowup: true,
    inSpatialHotspot: true,
  });
  assert(scoredCandidate.priorityScore > 70, `High priority score generated: ${scoredCandidate.priorityScore}`);
  assert(scoredCandidate.reasons.length >= 4, "Clear explainable priority reasons generated");

  const routePlan = optimizeDailyInspectionRoute([scoredCandidate], "BALANCED", 4);
  assert(routePlan.stops.length === 1, "Route plan generated stops successfully");
  assert(routePlan.totalDistanceKm > 0, "Route plan includes distance calculations");

  console.log("\n🎉 ALL 8 TEST SUITES PASSED FLAWLESSLY!\n");
}

runTestSuite().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

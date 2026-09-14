/**
 * GeoEpi Risk Engine (Version: GEOEPI-RISK-1.0)
 * Evaluates establishment risk from 0 to 100 based on multi-factor epidemiological indicators
 * with transparent, explainable point breakdowns.
 */

export interface RiskFactorInput {
  businessTypeBaseRisk?: number; // 0 - 30 (e.g. clinic=25, pharmacy=20, grocery=10)
  failedLastInspection?: boolean; // +20
  hasCriticalFinding?: boolean; // +15
  complaintLast90Days?: boolean; // +12
  isOverdueInspection?: boolean; // +10
  overdueDays?: number;
  inSpatialHotspot?: boolean; // +8
  licenseNearExpiryOrExpired?: boolean; // +7
  followupOverdue?: boolean; // +5
  repeatedFinding?: boolean; // +5
  missingOrInvalidGps?: boolean; // +3
  neighborhoodRiskFactor?: number; // 0 - 10 (spillover capped at max 10)
}

export interface RiskFactorItem {
  factor: string;
  weight: number;
  reason: string;
}

export interface RiskCalculationResult {
  score: number;
  level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  algorithmVersion: string;
  factors: RiskFactorItem[];
  neighborhoodRisk: number;
}

export function calculateGeoEpiRisk(input: RiskFactorInput): RiskCalculationResult {
  const factors: RiskFactorItem[] = [];
  let score = 0;

  // 1. Intrinsic Business Risk (10 - 25 pts)
  const baseRisk = Math.min(30, Math.max(5, input.businessTypeBaseRisk ?? 15));
  score += baseRisk;
  factors.push({
    factor: "INTRINSIC_RISK",
    weight: baseRisk,
    reason: `ความเสี่ยงตามประเภทสถานประกอบการ (+${baseRisk})`,
  });

  // 2. Previous Non-compliance (+20 pts)
  if (input.failedLastInspection) {
    score += 20;
    factors.push({
      factor: "NON_COMPLIANCE",
      weight: 20,
      reason: "ไม่ผ่านการตรวจประเมินครั้งล่าสุด (+20)",
    });
  }

  // 3. Critical Findings (+15 pts)
  if (input.hasCriticalFinding) {
    score += 15;
    factors.push({
      factor: "CRITICAL_FINDING",
      weight: 15,
      reason: "ตรวจพบข้อบกพร่องระดับวิกฤต (Critical Finding) (+15)",
    });
  }

  // 4. Complaint in last 90 days (+12 pts)
  if (input.complaintLast90Days) {
    score += 12;
    factors.push({
      factor: "COMPLAINT",
      weight: 12,
      reason: "มีเรื่องร้องเรียนใหม่ภายใน 90 วัน (+12)",
    });
  }

  // 5. Inspection Overdue (+10 pts)
  if (input.isOverdueInspection) {
    const pts = input.overdueDays && input.overdueDays > 180 ? 15 : 10;
    score += pts;
    factors.push({
      factor: "OVERDUE_INSPECTION",
      weight: pts,
      reason: `เกินกำหนดรอบการตรวจประเมิน ${input.overdueDays ? `(${input.overdueDays} วัน)` : ""} (+${pts})`,
    });
  }

  // 6. Spatial Hotspot (+8 pts)
  if (input.inSpatialHotspot) {
    score += 8;
    factors.push({
      factor: "SPATIAL_HOTSPOT",
      weight: 8,
      reason: "ตั้งอยู่ในพื้นที่จุดเสี่ยงหนาแน่น (Spatial Hotspot) (+8)",
    });
  }

  // 7. License Expiry (+7 pts)
  if (input.licenseNearExpiryOrExpired) {
    score += 7;
    factors.push({
      factor: "LICENSE_URGENCY",
      weight: 7,
      reason: "ใบอนุญาตหมดอายุหรือใกล้หมดอายุภายใน 90 วัน (+7)",
    });
  }

  // 8. Follow-up Overdue (+5 pts)
  if (input.followupOverdue) {
    score += 5;
    factors.push({
      factor: "FOLLOWUP_OVERDUE",
      weight: 5,
      reason: "เกินกำหนดติดตามผลการแก้ไข (+5)",
    });
  }

  // 9. Repeated Finding (+5 pts)
  if (input.repeatedFinding) {
    score += 5;
    factors.push({
      factor: "REPEATED_FINDING",
      weight: 5,
      reason: "พบข้อบกพร่องเดิมซ้ำ (+5)",
    });
  }

  // 10. Data Quality Warning (+3 pts)
  if (input.missingOrInvalidGps) {
    score += 3;
    factors.push({
      factor: "DATA_QUALITY",
      weight: 3,
      reason: "ข้อมูลพิกัดไม่สมบูรณ์ ขาดการยืนยัน (+3)",
    });
  }

  // 11. Neighborhood Risk Spillover (Capped at 10 pts max to prevent distortion)
  const neighborhoodRisk = Math.min(10, Math.max(0, input.neighborhoodRiskFactor ?? 0));
  if (neighborhoodRisk > 0) {
    score += neighborhoodRisk;
    factors.push({
      factor: "NEIGHBORHOOD_SPILLOVER",
      weight: neighborhoodRisk,
      reason: `ความเสี่ยงเหนี่ยวนำจากพื้นที่โดยรอบ (+${neighborhoodRisk.toFixed(1)})`,
    });
  }

  // Normalize final score to 0 - 100
  const finalScore = Math.min(100, Math.max(0, Math.round(score)));

  // Risk Level Classification
  let level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
  if (finalScore >= 75) {
    level = "CRITICAL";
  } else if (finalScore >= 55) {
    level = "HIGH";
  } else if (finalScore >= 35) {
    level = "MODERATE";
  } else {
    level = "LOW";
  }

  return {
    score: finalScore,
    level,
    algorithmVersion: "GEOEPI-RISK-1.0",
    factors,
    neighborhoodRisk,
  };
}

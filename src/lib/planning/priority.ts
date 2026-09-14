/**
 * GSIE: Stage 1 - Candidate Selection & Epidemiological Priority Scoring
 */

export interface PriorityWeights {
  individualRisk: number; // default 0.35
  spatialHotspot: number; // default 0.15
  inspectionOverdue: number; // default 0.15
  complaintUrgency: number; // default 0.10
  licenseUrgency: number; // default 0.10
  followupUrgency: number; // default 0.10
  geographicEfficiency: number; // default 0.05
}

export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  individualRisk: 0.35,
  spatialHotspot: 0.15,
  inspectionOverdue: 0.15,
  complaintUrgency: 0.10,
  licenseUrgency: 0.10,
  followupUrgency: 0.10,
  geographicEfficiency: 0.05,
};

export interface InspectionCandidate {
  id: string;
  name: string;
  businessType: string;
  subdistrict: string;
  latitude: number | null;
  longitude: number | null;
  riskScore: number;
  riskLevel: string;
  isOverdue: boolean;
  overdueDays: number;
  hasOpenComplaint: boolean;
  isLicenseNearExpiry: boolean;
  requiresFollowup: boolean;
  inSpatialHotspot: boolean;
  distanceFromBaseKm?: number;
  openingHours?: string;
  phone?: string;
}

export interface ScoredCandidate extends InspectionCandidate {
  priorityScore: number;
  primaryReason: string;
  reasons: string[];
}

export function calculateCandidatePriority(
  candidate: InspectionCandidate,
  weights: PriorityWeights = DEFAULT_PRIORITY_WEIGHTS
): ScoredCandidate {
  const reasons: string[] = [];

  // 1. Individual Risk Component (0 - 100 normalized to 0 - 100)
  const riskComponent = candidate.riskScore;
  if (candidate.riskScore >= 70) {
    reasons.push(`ความเสี่ยงสูง (Risk ${candidate.riskScore})`);
  }

  // 2. Spatial Hotspot (0 or 100)
  const hotspotComponent = candidate.inSpatialHotspot ? 100 : 0;
  if (candidate.inSpatialHotspot) {
    reasons.push("อยู่ในคลัสเตอร์จุดเสี่ยงหนาแน่น (Hotspot)");
  }

  // 3. Inspection Overdue (0 - 100 based on overdue days)
  let overdueComponent = 0;
  if (candidate.isOverdue) {
    overdueComponent = Math.min(100, (candidate.overdueDays / 180) * 100);
    reasons.push(`เกินกำหนดตรวจ ${candidate.overdueDays} วัน`);
  }

  // 4. Complaint Urgency (0 or 100)
  const complaintComponent = candidate.hasOpenComplaint ? 100 : 0;
  if (candidate.hasOpenComplaint) {
    reasons.push("มีเรื่องร้องเรียนที่ต้องตรวจสอบ");
  }

  // 5. License Urgency (0 or 100)
  const licenseComponent = candidate.isLicenseNearExpiry ? 100 : 0;
  if (candidate.isLicenseNearExpiry) {
    reasons.push("ใบอนุญาตใกล้หมดอายุ/หมดอายุ");
  }

  // 6. Follow-up Component (0 or 100)
  const followupComponent = candidate.requiresFollowup ? 100 : 0;
  if (candidate.requiresFollowup) {
    reasons.push("ต้องตรวจติดตามผลข้อบกพร่องเดิม");
  }

  // 7. Geographic Efficiency (Closer to base gets higher score 0 - 100)
  let geoComponent = 50;
  if (candidate.distanceFromBaseKm !== undefined) {
    geoComponent = Math.max(0, 100 - candidate.distanceFromBaseKm * 3);
  }

  const priorityScore =
    riskComponent * weights.individualRisk +
    hotspotComponent * weights.spatialHotspot +
    overdueComponent * weights.inspectionOverdue +
    complaintComponent * weights.complaintUrgency +
    licenseComponent * weights.licenseUrgency +
    followupComponent * weights.followupUrgency +
    geoComponent * weights.geographicEfficiency;

  const normalizedPriority = Number(priorityScore.toFixed(1));
  const primaryReason =
    reasons.length > 0 ? reasons.join(" • ") : "การตรวจประเมินตามรอบเฝ้าระวังปกติ";

  return {
    ...candidate,
    priorityScore: normalizedPriority,
    primaryReason,
    reasons,
  };
}

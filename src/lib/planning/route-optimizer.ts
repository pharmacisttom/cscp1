/**
 * GSIE: Stage 2 - Route Optimization & Traveling Salesperson Heuristics (2-opt)
 */

import { haversineDistanceKm, estimateTravelMinutes } from "../maps/distance";
import { ScoredCandidate } from "./priority";

export type RouteScenario =
  | "RISK_FIRST"
  | "SHORTEST_ROUTE"
  | "MAX_COVERAGE"
  | "HOTSPOT_CONTROL"
  | "BALANCED";

export interface RouteStop {
  stopOrder: number;
  businessId: string;
  businessName: string;
  businessType: string;
  subdistrict: string;
  latitude: number;
  longitude: number;
  riskScore: number;
  riskLevel: string;
  priorityScore: number;
  whyThisStop: string;
  distanceFromPrevKm: number;
  travelMinutesFromPrev: number;
  arrivalTime: string; // e.g. "09:00"
  departureTime: string; // e.g. "09:45"
  durationMinutes: number;
}

export interface RoutePlanResult {
  scenario: RouteScenario;
  startLocationName: string;
  startLat: number;
  startLng: number;
  totalStops: number;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  stops: RouteStop[];
  summary: string;
}

export const CSCP_HQ_BASE = {
  name: "ศูนย์ CSCP โรงพยาบาลปลวกแดง จังหวัดระยอง",
  lat: 12.969713,
  lng: 101.219305,
  address: "ถนนเทศบาล 6 ต.ปลวกแดง อ.ปลวกแดง จ.ระยอง 21140",
};

export function optimizeDailyInspectionRoute(
  candidates: ScoredCandidate[],
  scenario: RouteScenario = "BALANCED",
  maxStops = 6,
  startPoint = CSCP_HQ_BASE
): RoutePlanResult {
  // 1. Filter out candidates without valid coordinates
  const validCandidates = candidates.filter(
    (c) => c.latitude !== null && c.longitude !== null
  );

  if (validCandidates.length === 0) {
    return {
      scenario,
      startLocationName: startPoint.name,
      startLat: startPoint.lat,
      startLng: startPoint.lng,
      totalStops: 0,
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
      stops: [],
      summary: "ไม่พบสถานประกอบการที่มีพิกัด GPS สำหรับจัดเส้นทาง",
    };
  }

  // 2. Candidate Selection based on Scenario
  let pool = [...validCandidates];

  switch (scenario) {
    case "RISK_FIRST":
      // Sort primarily by Risk Score
      pool.sort((a, b) => b.riskScore - a.riskScore);
      break;
    case "SHORTEST_ROUTE":
      // Sort primarily by proximity to start point
      pool.sort((a, b) => {
        const distA = haversineDistanceKm(startPoint.lat, startPoint.lng, a.latitude!, a.longitude!);
        const distB = haversineDistanceKm(startPoint.lat, startPoint.lng, b.latitude!, b.longitude!);
        return distA - distB;
      });
      break;
    case "HOTSPOT_CONTROL":
      // Prioritize candidates in hotspots or with complaints
      pool.sort((a, b) => {
        const scoreA = (a.inSpatialHotspot ? 50 : 0) + (a.hasOpenComplaint ? 40 : 0) + a.riskScore;
        const scoreB = (b.inSpatialHotspot ? 50 : 0) + (b.hasOpenComplaint ? 40 : 0) + b.riskScore;
        return scoreB - scoreA;
      });
      break;
    case "MAX_COVERAGE":
      // Prioritize overdue candidates or never inspected
      pool.sort((a, b) => {
        const scoreA = (a.isOverdue ? 40 : 0) + a.priorityScore;
        const scoreB = (b.isOverdue ? 40 : 0) + b.priorityScore;
        return scoreB - scoreA;
      });
      break;
    case "BALANCED":
    default:
      // Balanced: GSIE Priority Score
      pool.sort((a, b) => b.priorityScore - a.priorityScore);
      break;
  }

  // Pick top N candidates
  const selected = pool.slice(0, maxStops);

  // 3. Nearest Neighbor Route Initialization
  const unvisited = [...selected];
  const orderedRoute: ScoredCandidate[] = [];
  let currentLat = startPoint.lat;
  let currentLng = startPoint.lng;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let shortestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversineDistanceKm(
        currentLat,
        currentLng,
        unvisited[i].latitude!,
        unvisited[i].longitude!
      );
      if (dist < shortestDist) {
        shortestDist = dist;
        nearestIndex = i;
      }
    }

    const nextStop = unvisited.splice(nearestIndex, 1)[0];
    orderedRoute.push(nextStop);
    currentLat = nextStop.latitude!;
    currentLng = nextStop.longitude!;
  }

  // 4. 2-opt Heuristic to untangle crossing paths
  const optimized = twoOpt(orderedRoute, startPoint);

  // 5. Build Schedule with Time Windows & Lunch Break
  let currentTimeMinutes = 8 * 60 + 30; // Starts at 08:30
  let prevLat = startPoint.lat;
  let prevLng = startPoint.lng;
  let totalDistance = 0;
  const stops: RouteStop[] = [];

  for (let i = 0; i < optimized.length; i++) {
    const item = optimized[i];
    const dist = haversineDistanceKm(prevLat, prevLng, item.latitude!, item.longitude!);
    totalDistance += dist;
    const travelMins = estimateTravelMinutes(dist);

    currentTimeMinutes += travelMins;

    // Check lunch break: if time reaches 12:00 - 13:00, add 45-60 min lunch
    if (currentTimeMinutes >= 12 * 60 && currentTimeMinutes < 12 * 60 + 45) {
      currentTimeMinutes = 13 * 60; // Resume after 13:00
    }

    const arrivalTime = formatMinutesToTime(currentTimeMinutes);
    const durationMinutes = item.riskScore >= 70 ? 60 : 45; // High risk takes longer
    const departureMinutes = currentTimeMinutes + durationMinutes;
    const departureTime = formatMinutesToTime(departureMinutes);
    currentTimeMinutes = departureMinutes;

    const stopOrder = i + 1;
    stops.push({
      stopOrder,
      businessId: item.id,
      businessName: item.name,
      businessType: item.businessType,
      subdistrict: item.subdistrict,
      latitude: item.latitude!,
      longitude: item.longitude!,
      riskScore: item.riskScore,
      riskLevel: item.riskLevel,
      priorityScore: item.priorityScore,
      whyThisStop: buildWhyThisStopReason(item, dist, stopOrder),
      distanceFromPrevKm: dist,
      travelMinutesFromPrev: travelMins,
      arrivalTime,
      departureTime,
      durationMinutes,
    });

    prevLat = item.latitude!;
    prevLng = item.longitude!;
  }

  // Return to base
  const returnDist = haversineDistanceKm(prevLat, prevLng, startPoint.lat, startPoint.lng);
  totalDistance += returnDist;
  const totalDuration = currentTimeMinutes - (8 * 60 + 30) + estimateTravelMinutes(returnDist);

  return {
    scenario,
    startLocationName: startPoint.name,
    startLat: startPoint.lat,
    startLng: startPoint.lng,
    totalStops: stops.length,
    totalDistanceKm: Number(totalDistance.toFixed(1)),
    totalDurationMinutes: totalDuration,
    stops,
    summary: `แผนตรวจแบบ ${getScenarioLabel(scenario)}: ${stops.length} จุดตรวจ รวมระยะทาง ${totalDistance.toFixed(1)} กม. ใช้เวลาประมาณ ${Math.floor(totalDuration / 60)} ชม. ${totalDuration % 60} นาที`,
  };
}

/**
 * 2-opt Traveling Salesperson heuristic algorithm
 */
function twoOpt(
  route: ScoredCandidate[],
  startPoint: { lat: number; lng: number }
): ScoredCandidate[] {
  if (route.length <= 2) return route;

  let best = [...route];
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let k = i + 1; k < best.length; k++) {
        const newRoute = twoOptSwap(best, i, k);
        if (calculateTotalDistance(newRoute, startPoint) < calculateTotalDistance(best, startPoint)) {
          best = newRoute;
          improved = true;
        }
      }
    }
  }

  return best;
}

function twoOptSwap(route: ScoredCandidate[], i: number, k: number): ScoredCandidate[] {
  const result: ScoredCandidate[] = [];
  for (let c = 0; c < i; c++) result.push(route[c]);
  for (let c = k; c >= i; c--) result.push(route[c]);
  for (let c = k + 1; c < route.length; c++) result.push(route[c]);
  return result;
}

function calculateTotalDistance(
  route: ScoredCandidate[],
  startPoint: { lat: number; lng: number }
): number {
  let dist = 0;
  let curLat = startPoint.lat;
  let curLng = startPoint.lng;
  for (const stop of route) {
    dist += haversineDistanceKm(curLat, curLng, stop.latitude!, stop.longitude!);
    curLat = stop.latitude!;
    curLng = stop.longitude!;
  }
  dist += haversineDistanceKm(curLat, curLng, startPoint.lat, startPoint.lng);
  return dist;
}

function formatMinutesToTime(totalMinutes: number): string {
  const hrs = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function buildWhyThisStopReason(
  candidate: ScoredCandidate,
  distFromPrevKm: number,
  stopOrder: number
): string {
  const parts: string[] = [];
  if (candidate.riskScore >= 75) {
    parts.push(`ความเสี่ยงวิกฤต (Risk ${candidate.riskScore})`);
  } else if (candidate.riskScore >= 55) {
    parts.push(`ความเสี่ยงสูง (Risk ${candidate.riskScore})`);
  }
  if (candidate.hasOpenComplaint) {
    parts.push("มีเรื่องร้องเรียนเร่งด่วน");
  }
  if (candidate.isOverdue) {
    parts.push(`เกินกำหนดตรวจ ${candidate.overdueDays} วัน`);
  }
  if (candidate.inSpatialHotspot) {
    parts.push("อยู่ในจุดเสี่ยงหนาแน่นเดียวกับคลัสเตอร์");
  }
  if (candidate.requiresFollowup) {
    parts.push("ต้องติดตามผลการแก้ไข");
  }

  parts.push(`ห่างจากจุดก่อนหน้า ${distFromPrevKm.toFixed(1)} กม.`);
  parts.push(`ลำดับจุดตรวจที่ ${stopOrder}`);
  return parts.join(" • ");
}

export function getScenarioLabel(scenario: RouteScenario): string {
  switch (scenario) {
    case "RISK_FIRST":
      return "เน้นความเสี่ยงสูงสุด (Risk First)";
    case "SHORTEST_ROUTE":
      return "ระยะทางสั้นที่สุด (Shortest Route)";
    case "MAX_COVERAGE":
      return "ตรวจได้จำนวนมากที่สุด (Maximum Coverage)";
    case "HOTSPOT_CONTROL":
      return "ควบคุมพื้นที่จุดเสี่ยง (Hotspot Control)";
    case "BALANCED":
    default:
      return "สมดุลความเสี่ยงและระยะทาง (Balanced)";
  }
}

/**
 * Hexagonal & Rectangular Spatial Grid Surveillance Engine
 * Provides spatial binning for epidemiology indicators with automatic latitude/longitude grid fallback.
 */

export interface GridCellMetrics {
  cellId: string;
  gridType: "H3_HEX" | "LAT_LNG_GRID";
  centerLat: number;
  centerLng: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  businessCount: number;
  inspectedCount: number;
  failedCount: number;
  complaintCount: number;
  overdueCount: number;
  criticalCount: number;
  averageRisk: number;
  coverageRate: number;
  complaintRate: number;
  failureRate: number;
}

export interface PointWithMetrics {
  id: string;
  lat: number;
  lng: number;
  riskScore: number;
  isInspected: boolean;
  isFailed: boolean;
  hasComplaint: boolean;
  isOverdue: boolean;
  isCritical: boolean;
}

/**
 * Computes a robust rectangular grid (~1km resolution = ~0.009 degrees lat/lon)
 */
export function aggregateToSpatialGrid(
  points: PointWithMetrics[],
  gridSizeDeg = 0.01 // Approximately 1.1 km
): GridCellMetrics[] {
  const cellMap = new Map<string, PointWithMetrics[]>();

  for (const p of points) {
    if (isNaN(p.lat) || isNaN(p.lng)) continue;
    const gridX = Math.floor(p.lng / gridSizeDeg);
    const gridY = Math.floor(p.lat / gridSizeDeg);
    const key = `GRID_${gridY}_${gridX}`;

    if (!cellMap.has(key)) {
      cellMap.set(key, []);
    }
    cellMap.get(key)!.push(p);
  }

  const result: GridCellMetrics[] = [];

  for (const [key, cellPoints] of cellMap.entries()) {
    const count = cellPoints.length;
    const inspected = cellPoints.filter((p) => p.isInspected).length;
    const failed = cellPoints.filter((p) => p.isFailed).length;
    const complaints = cellPoints.filter((p) => p.hasComplaint).length;
    const overdue = cellPoints.filter((p) => p.isOverdue).length;
    const critical = cellPoints.filter((p) => p.isCritical).length;

    const totalRisk = cellPoints.reduce((sum, p) => sum + p.riskScore, 0);
    const avgRisk = Number((totalRisk / count).toFixed(1));

    const avgLat = cellPoints.reduce((s, p) => s + p.lat, 0) / count;
    const avgLng = cellPoints.reduce((s, p) => s + p.lng, 0) / count;

    // Derived rates
    const coverageRate = count > 0 ? Number(((inspected / count) * 100).toFixed(1)) : 0;
    const failureRate = inspected > 0 ? Number(((failed / inspected) * 100).toFixed(1)) : 0;
    const complaintRate = count > 0 ? Number(((complaints / count) * 100).toFixed(1)) : 0;

    const parts = key.split("_");
    const gridY = parseInt(parts[1], 10);
    const gridX = parseInt(parts[2], 10);

    const south = gridY * gridSizeDeg;
    const north = (gridY + 1) * gridSizeDeg;
    const west = gridX * gridSizeDeg;
    const east = (gridX + 1) * gridSizeDeg;

    result.push({
      cellId: key,
      gridType: "LAT_LNG_GRID",
      centerLat: Number(avgLat.toFixed(6)),
      centerLng: Number(avgLng.toFixed(6)),
      bounds: { north, south, east, west },
      businessCount: count,
      inspectedCount: inspected,
      failedCount: failed,
      complaintCount: complaints,
      overdueCount: overdue,
      criticalCount: critical,
      averageRisk: avgRisk,
      coverageRate,
      complaintRate,
      failureRate,
    });
  }

  return result;
}

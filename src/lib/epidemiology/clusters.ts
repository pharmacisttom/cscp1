/**
 * Spatial Cluster Detection using DBSCAN and Weighted Density Hotspots
 */

import { haversineDistanceKm } from "../maps/distance";

export interface GeoPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  riskScore: number;
}

export interface SpatialClusterResult {
  clusterId: string;
  clusterType: "HOTSPOT" | "SPATIAL_CLUSTER" | "RISK_CONCENTRATION";
  clusterRisk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  businessCount: number;
  averageRisk: number;
  centroidLat: number;
  centroidLng: number;
  radiusMeters: number;
  businessIds: string[];
}

/**
 * Density-Based Spatial Clustering of Applications with Noise (DBSCAN)
 * @param points Array of geographic establishments
 * @param epsKm Radius in Kilometers (e.g. 0.8 km)
 * @param minPts Minimum points to form a cluster (e.g. 3)
 */
export function detectSpatialClusters(
  points: GeoPoint[],
  epsKm = 0.8,
  minPts = 3
): SpatialClusterResult[] {
  if (points.length < minPts) return [];

  const visited = new Set<string>();
  const clustered = new Set<string>();
  const clusters: GeoPoint[][] = [];

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (visited.has(point.id)) continue;
    visited.add(point.id);

    const neighbors = getNeighbors(point, points, epsKm);

    if (neighbors.length + 1 >= minPts) {
      const currentCluster: GeoPoint[] = [point];
      clustered.add(point.id);

      const queue = [...neighbors];
      while (queue.length > 0) {
        const neighbor = queue.shift()!;
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          const neighborNeighbors = getNeighbors(neighbor, points, epsKm);
          if (neighborNeighbors.length + 1 >= minPts) {
            queue.push(...neighborNeighbors);
          }
        }
        if (!clustered.has(neighbor.id)) {
          clustered.add(neighbor.id);
          currentCluster.push(neighbor);
        }
      }

      clusters.push(currentCluster);
    }
  }

  // Transform clusters into result summary
  return clusters.map((cluster, index) => {
    const count = cluster.length;
    const totalRisk = cluster.reduce((sum, p) => sum + p.riskScore, 0);
    const avgRisk = Number((totalRisk / count).toFixed(1));

    const totalLat = cluster.reduce((sum, p) => sum + p.lat, 0);
    const totalLng = cluster.reduce((sum, p) => sum + p.lng, 0);
    const centroidLat = Number((totalLat / count).toFixed(6));
    const centroidLng = Number((totalLng / count).toFixed(6));

    // Calculate maximum distance from centroid as radius
    let maxDistKm = 0;
    for (const p of cluster) {
      const d = haversineDistanceKm(centroidLat, centroidLng, p.lat, p.lng);
      if (d > maxDistKm) maxDistKm = d;
    }
    const radiusMeters = Math.max(300, Math.round(maxDistKm * 1000) + 100);

    let clusterRisk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "MODERATE";
    if (avgRisk >= 75) clusterRisk = "CRITICAL";
    else if (avgRisk >= 55) clusterRisk = "HIGH";
    else if (avgRisk >= 35) clusterRisk = "MODERATE";
    else clusterRisk = "LOW";

    return {
      clusterId: `CLUSTER-${index + 1}`,
      clusterType: avgRisk >= 55 ? "HOTSPOT" : "SPATIAL_CLUSTER",
      clusterRisk,
      businessCount: count,
      averageRisk: avgRisk,
      centroidLat,
      centroidLng,
      radiusMeters,
      businessIds: cluster.map((p) => p.id),
    };
  });
}

function getNeighbors(target: GeoPoint, allPoints: GeoPoint[], epsKm: number): GeoPoint[] {
  return allPoints.filter(
    (p) =>
      p.id !== target.id &&
      haversineDistanceKm(target.lat, target.lng, p.lat, p.lng) <= epsKm
  );
}

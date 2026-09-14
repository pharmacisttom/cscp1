/**
 * GIS Map Provider Configuration
 * Primary: Longdo Map API (Thailand's leading digital map service)
 * Key: ad6d7ca9219f8ed0c10600426d4bff02
 */

export const LONGDO_MAP_KEY =
  process.env.NEXT_PUBLIC_LONGDO_MAP_KEY || "ad6d7ca9219f8ed0c10600426d4bff02";

export interface MapTileConfig {
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string;
}

export const MAP_PROVIDERS: Record<string, MapTileConfig> = {
  longdo: {
    name: "Longdo Map (ลองดู แมพ - ประเทศไทย)",
    url: `https://ms.longdo.com/map/msn-server/tile.php?zoom={z}&x={x}&y={y}&key=${LONGDO_MAP_KEY}`,
    attribution:
      '&copy; <a href="https://map.longdo.com/" target="_blank" rel="noreferrer">Longdo Map</a> | CSCP GeoEpi ปลวกแดง',
    maxZoom: 19,
  },
  openstreetmap: {
    name: "OpenStreetMap",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | CSCP GeoEpi',
    maxZoom: 19,
  },
};

export function getActiveTileConfig(): MapTileConfig {
  const provider = process.env.NEXT_PUBLIC_MAP_PROVIDER || "longdo";
  return MAP_PROVIDERS[provider] || MAP_PROVIDERS.longdo;
}

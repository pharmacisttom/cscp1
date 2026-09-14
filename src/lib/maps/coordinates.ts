/**
 * Geographic Coordinate Parser & Validator for Thailand & Rayong
 */

export interface ParsedCoordinate {
  latitude: number | null;
  longitude: number | null;
  isValid: boolean;
  accuracyMeters?: number;
  source: "IMPORT" | "MANUAL" | "GPS" | "GEOCODING" | "VERIFIED_GPS";
  errorReason?: string;
}

// Bounding box for Rayong Province (with slight margin)
export const RAYONG_BOUNDS = {
  minLat: 12.5,
  maxLat: 13.3,
  minLng: 101.0,
  maxLng: 101.9,
};

// Pluak Daeng approximate centroid
export const PLUAK_DAENG_CENTER = {
  lat: 12.9754,
  lng: 101.2154,
};

/**
 * Parses raw text, comma-separated coordinates, or DMS strings into clean WGS84 decimal numbers.
 */
export function parseCoordinates(rawInput: unknown): ParsedCoordinate {
  if (!rawInput) {
    return {
      latitude: null,
      longitude: null,
      isValid: false,
      source: "IMPORT",
      errorReason: "พิกัดว่างเปล่า (Empty)",
    };
  }

  const text = String(rawInput).trim();
  if (!text) {
    return {
      latitude: null,
      longitude: null,
      isValid: false,
      source: "IMPORT",
      errorReason: "พิกัดว่างเปล่า",
    };
  }

  // Handle formats like: "12.9754, 101.2154" or "lat: 12.9754 lon: 101.2154"
  const clean = text.replace(/[a-zA-Z:]+/g, " ").trim();
  const parts = clean.split(/[,;\s]+/).filter((p) => !isNaN(parseFloat(p)));

  if (parts.length >= 2) {
    let lat = parseFloat(parts[0]);
    let lng = parseFloat(parts[1]);

    // Sometimes users enter lon, lat in reverse:
    if (lat > 90 && lng <= 90) {
      const temp = lat;
      lat = lng;
      lng = temp;
    }

    if (isNaN(lat) || isNaN(lng)) {
      return {
        latitude: null,
        longitude: null,
        isValid: false,
        source: "IMPORT",
        errorReason: "ไม่สามารถแปลงเป็นตัวเลขพิกัดได้",
      };
    }

    // Verify Thailand bounds (Lat roughly 5 to 21, Lng roughly 97 to 106)
    if (lat < 5.0 || lat > 21.0 || lng < 97.0 || lng > 106.0) {
      return {
        latitude: lat,
        longitude: lng,
        isValid: false,
        source: "IMPORT",
        errorReason: "พิกัดอยู่นอกเขตประเทศไทย",
      };
    }

    return {
      latitude: Number(lat.toFixed(7)),
      longitude: Number(lng.toFixed(7)),
      isValid: true,
      source: "IMPORT",
    };
  }

  return {
    latitude: null,
    longitude: null,
    isValid: false,
    source: "IMPORT",
    errorReason: "รูปแบบพิกัดไม่ถูกต้อง (Format unrecognized)",
  };
}

/**
 * Format lat, lng for display
 */
export function formatCoordinates(lat: number | null | undefined, lng: number | null | undefined): string {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return "ไม่มีข้อมูลพิกัด (No GPS)";
  }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

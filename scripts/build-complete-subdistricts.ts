import fs from "fs";
import path from "path";

// Define accurate geographic bounding polygons for the 6 subdistricts of Pluak Daeng
const subdistrictsData = [
  {
    name: "ตำบลปลวกแดง",
    name_en: "Pluak Daeng",
    code: "210601",
    center: [12.9754, 101.2154],
    color: "#0d9488",
    // Polygon around Pluak Daeng center and Dok Krai reservoir area
    coordinates: [
      [
        [101.185, 12.995],
        [101.235, 13.005],
        [101.255, 12.985],
        [101.245, 12.945],
        [101.210, 12.940],
        [101.180, 12.960],
        [101.185, 12.995],
      ],
    ],
  },
  {
    name: "ตำบลมาบยางพร",
    name_en: "Map Yang Phon",
    code: "210605",
    center: [12.9654, 101.1404],
    color: "#0284c7",
    // Western industrial subdistrict bordering Chonburi / Amata City
    coordinates: [
      [
        [101.095, 13.010],
        [101.185, 12.995],
        [101.180, 12.960],
        [101.170, 12.925],
        [101.100, 12.920],
        [101.085, 12.970],
        [101.095, 13.010],
      ],
    ],
  },
  {
    name: "ตำบลตาสิทธิ์",
    name_en: "Ta Sit",
    code: "210602",
    center: [13.0454, 101.2284],
    color: "#8b5cf6",
    // Northern subdistrict bordering Chonburi (Si Racha / Ban Bueng)
    coordinates: [
      [
        [101.135, 13.085],
        [101.245, 13.100],
        [101.275, 13.050],
        [101.235, 13.005],
        [101.185, 12.995],
        [101.095, 13.010],
        [101.135, 13.085],
      ],
    ],
  },
  {
    name: "ตำบลละหาร",
    name_en: "Lahan",
    code: "210603",
    center: [12.9804, 101.2954],
    color: "#f59e0b",
    // Eastern subdistrict bordering Wang Chan and Ban Khai
    coordinates: [
      [
        [101.255, 12.985],
        [101.320, 13.010],
        [101.345, 12.960],
        [101.310, 12.930],
        [101.245, 12.945],
        [101.255, 12.985],
      ],
    ],
  },
  {
    name: "ตำบลแม่น้ำคู้",
    name_en: "Mae Nam Khu",
    code: "210604",
    center: [12.9154, 101.2204],
    color: "#10b981",
    // Southern subdistrict bordering Nikhom Phatthana & Dok Krai
    coordinates: [
      [
        [101.170, 12.925],
        [101.210, 12.940],
        [101.245, 12.945],
        [101.270, 12.885],
        [101.220, 12.875],
        [101.165, 12.890],
        [101.170, 12.925],
      ],
    ],
  },
  {
    name: "ตำบลหนองไร่",
    name_en: "Nong Rai",
    code: "210606",
    center: [13.0104, 101.3204],
    color: "#ec4899",
    // North-Eastern subdistrict bordering Wang Chan
    coordinates: [
      [
        [101.275, 13.050],
        [101.350, 13.060],
        [101.365, 13.000],
        [101.320, 13.010],
        [101.255, 12.985],
        [101.275, 13.050],
      ],
    ],
  },
];

const features = subdistrictsData.map((d) => ({
  type: "Feature",
  properties: {
    name: d.name,
    name_en: d.name_en,
    subdistrictName: d.name.replace("ตำบล", ""),
    code: d.code,
    centerLat: d.center[0],
    centerLng: d.center[1],
    color: d.color,
    type: "SUBDISTRICT",
    district: "ปลวกแดง",
    province: "ระยอง",
  },
  geometry: {
    type: "Polygon",
    coordinates: d.coordinates,
  },
}));

const geojson = {
  type: "FeatureCollection",
  features,
};

const outputPath = path.join(
  process.cwd(),
  "public",
  "geojson",
  "pluakdaeng_subdistricts.geojson"
);

fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
console.log(`✅ Successfully generated all 6 subdistricts for Pluak Daeng!`);

import fs from "fs";
import path from "path";

async function fetchPluakDaengSubdistricts() {
  const query = `[out:json][timeout:30];
area["name:th"="อำเภอปลวกแดง"]->.a;
(
  relation["admin_level"="8"](area.a);
);
out geom;`;

  console.log("Querying Overpass for Pluak Daeng subdistricts...");
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "User-Agent": "CSCP-GeoEpi/1.0",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "data=" + encodeURIComponent(query),
  });

  const json = await res.json();
  console.log(`Found ${json.elements?.length || 0} subdistrict relations.`);

  const features: any[] = [];

  for (const el of json.elements || []) {
    const name = el.tags["name:th"] || el.tags["name"] || "ตำบล";
    // Build polygon coordinates from geometry members
    const coordinates: [number, number][] = [];
    for (const m of el.members || []) {
      if (m.geometry) {
        for (const pt of m.geometry) {
          coordinates.push([pt.lon, pt.lat]);
        }
      }
    }

    if (coordinates.length > 0) {
      features.push({
        type: "Feature",
        properties: {
          name,
          name_en: el.tags["name:en"] || "",
          type: "SUBDISTRICT",
          district: "ปลวกแดง",
          province: "ระยอง",
        },
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
      });
      console.log(`  ✓ Converted: ${name} (${coordinates.length} points)`);
    }
  }

  if (features.length > 0) {
    const outputPath = path.join(
      process.cwd(),
      "public",
      "geojson",
      "pluakdaeng_subdistricts.geojson"
    );
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          type: "FeatureCollection",
          features,
        },
        null,
        2
      )
    );
    console.log(`✅ Saved all ${features.length} subdistricts to pluakdaeng_subdistricts.geojson!`);
  }
}

fetchPluakDaengSubdistricts().catch(console.error);

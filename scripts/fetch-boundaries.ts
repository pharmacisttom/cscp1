import fs from "fs";
import path from "path";

async function fetchGeoJson(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=geojson&polygon_geojson=1&limit=1`;

  console.log(`Fetching: [${query}]...`);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "CSCP-GeoEpi-BoundaryFetcher/1.0 (contact@cscp.local)",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${query}: ${res.status}`);
  }

  const json = await res.json();
  if (json.features && json.features.length > 0) {
    return json.features[0];
  }
  return null;
}

async function run() {
  const outputDir = path.join(process.cwd(), "public", "geojson");
  fs.mkdirSync(outputDir, { recursive: true });

  // 1. Rayong Province Boundary
  const rayongFeature = await fetchGeoJson("จังหวัดระยอง");
  if (rayongFeature) {
    fs.writeFileSync(
      path.join(outputDir, "rayong_province.geojson"),
      JSON.stringify(
        {
          type: "FeatureCollection",
          features: [
            {
              ...rayongFeature,
              properties: {
                name: "จังหวัดระยอง",
                name_en: "Rayong Province",
                type: "PROVINCE",
                code: "21",
              },
            },
          ],
        },
        null,
        2
      )
    );
    console.log("✅ Saved rayong_province.geojson");
  }

  // Rate limit safe pause
  await new Promise((r) => setTimeout(r, 1200));

  // 2. Districts in Rayong (8 Districts)
  const districts = [
    "อำเภอปลวกแดง",
    "อำเภอเมืองระยอง",
    "อำเภอบ้านฉาง",
    "อำเภอแกลง",
    "อำเภอวังจันทร์",
    "อำเภอบ้านค่าย",
    "อำเภอเขาชะเมา",
    "อำเภอนิคมพัฒนา",
  ];

  const districtFeatures: any[] = [];
  for (const d of districts) {
    await new Promise((r) => setTimeout(r, 1200));
    try {
      const feat = await fetchGeoJson(`${d} จังหวัดระยอง`);
      if (feat) {
        districtFeatures.push({
          ...feat,
          properties: {
            name: d,
            type: "DISTRICT",
            province: "ระยอง",
          },
        });
        console.log(`  ✓ Got boundary for ${d}`);
      }
    } catch (e: any) {
      console.error(`  ⚠️ Failed ${d}:`, e.message);
    }
  }

  if (districtFeatures.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, "rayong_districts.geojson"),
      JSON.stringify(
        {
          type: "FeatureCollection",
          features: districtFeatures,
        },
        null,
        2
      )
    );
    console.log(`✅ Saved rayong_districts.geojson (${districtFeatures.length} districts)`);
  }

  // 3. Subdistricts in Pluak Daeng (6 Tambon)
  const subdistricts = [
    "ตำบลปลวกแดง",
    "ตำบลตาสิทธิ์",
    "ตำบลละหาร",
    "ตำบลแม่น้ำคู้",
    "ตำบลมาบยางพร",
    "ตำบลหนองไร่",
  ];

  const subdistrictFeatures: any[] = [];
  for (const s of subdistricts) {
    await new Promise((r) => setTimeout(r, 1200));
    try {
      const feat = await fetchGeoJson(`${s} อำเภอปลวกแดง จังหวัดระยอง`);
      if (feat) {
        subdistrictFeatures.push({
          ...feat,
          properties: {
            name: s,
            subdistrictName: s.replace("ตำบล", ""),
            type: "SUBDISTRICT",
            district: "ปลวกแดง",
            province: "ระยอง",
          },
        });
        console.log(`  ✓ Got boundary for ${s}`);
      }
    } catch (e: any) {
      console.error(`  ⚠️ Failed ${s}:`, e.message);
    }
  }

  if (subdistrictFeatures.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, "pluakdaeng_subdistricts.geojson"),
      JSON.stringify(
        {
          type: "FeatureCollection",
          features: subdistrictFeatures,
        },
        null,
        2
      )
    );
    console.log(
      `✅ Saved pluakdaeng_subdistricts.geojson (${subdistrictFeatures.length} subdistricts)`
    );
  }
}

run().catch(console.error);

import fs from "fs";
import path from "path";

async function fetchEn() {
  const queries = [
    { th: "ตำบลปลวกแดง", q: "Pluak Daeng, Rayong" },
    { th: "ตำบลตาสิทธิ์", q: "Ta Sit, Pluak Daeng, Rayong" },
    { th: "ตำบลละหาร", q: "Lahan, Pluak Daeng, Rayong" },
    { th: "ตำบลแม่น้ำคู้", q: "Mae Nam Khu, Pluak Daeng, Rayong" },
    { th: "ตำบลมาบยางพร", q: "Map Yang Phon, Pluak Daeng, Rayong" },
    { th: "ตำบลหนองไร่", q: "Nong Rai, Pluak Daeng, Rayong" },
  ];

  const features: any[] = [];

  for (const item of queries) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      item.q
    )}&format=geojson&polygon_geojson=1&limit=1`;

    console.log(`Querying: ${item.q}...`);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "CSCP-GeoEpi-Fetcher/1.0" },
      });
      const json = await res.json();
      if (json.features && json.features.length > 0) {
        features.push({
          ...json.features[0],
          properties: {
            name: item.th,
            subdistrictName: item.th.replace("ตำบล", ""),
            type: "SUBDISTRICT",
            district: "ปลวกแดง",
            province: "ระยอง",
          },
        });
        console.log(`  ✓ Successfully fetched ${item.th}`);
      } else {
        console.log(`  ⚠️ No polygon for ${item.q}`);
      }
    } catch (e: any) {
      console.error(`  Error for ${item.q}:`, e.message);
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`Fetched ${features.length} subdistricts.`);
  if (features.length > 0) {
    fs.writeFileSync(
      path.join(process.cwd(), "public", "geojson", "pluakdaeng_subdistricts.geojson"),
      JSON.stringify({ type: "FeatureCollection", features }, null, 2)
    );
    console.log("Saved pluakdaeng_subdistricts.geojson");
  }
}

fetchEn();

async function check() {
  const res = await fetch("http://localhost:3000/map");
  const html = await res.text();
  const cssMatches = [...html.matchAll(/href="(\/_next\/static\/css\/[^"]+)"/g)];
  console.log("CSS links found:", cssMatches.map(m => m[1]));

  for (const match of cssMatches) {
    const cssRes = await fetch("http://localhost:3000" + match[1]);
    const css = await cssRes.text();
    console.log(`Checking ${match[1]}:`);
    console.log("  Contains .leaflet-tile:", css.includes(".leaflet-tile"));
    console.log("  Contains .leaflet-pane:", css.includes(".leaflet-pane"));
    console.log("  Contains .leaflet-marker-icon:", css.includes(".leaflet-marker-icon"));
    console.log("  Contains .leaflet-container:", css.includes(".leaflet-container"));
  }
}
check().catch(console.error);

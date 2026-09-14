import fs from "fs";

async function testLongdoBoundary() {
  const apiKey = "ad6d7ca9219f8ed0c10600426d4bff02";
  const url = `https://api.longdo.com/map/services/boundary?code=21&key=${apiKey}`;
  console.log("Fetching Longdo boundary:", url);

  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response sample:", text.substring(0, 300));
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

testLongdoBoundary();

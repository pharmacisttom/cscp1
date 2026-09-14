import { NextRequest, NextResponse } from "next/server";
import * as path from "path";
import * as fs from "fs/promises";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level") || "all";

    const geojsonDir = path.join(process.cwd(), "public", "geojson");

    let province: any = null;
    let districts: any = null;
    let subdistricts: any = null;

    if (level === "all" || level === "province") {
      try {
        const provData = await fs.readFile(
          path.join(geojsonDir, "rayong_province.geojson"),
          "utf-8"
        );
        province = JSON.parse(provData);
      } catch (e) {}
    }

    if (level === "all" || level === "district") {
      try {
        const distData = await fs.readFile(
          path.join(geojsonDir, "rayong_districts.geojson"),
          "utf-8"
        );
        districts = JSON.parse(distData);
      } catch (e) {}
    }

    if (level === "all" || level === "subdistrict") {
      try {
        const subData = await fs.readFile(
          path.join(geojsonDir, "pluakdaeng_subdistricts.geojson"),
          "utf-8"
        );
        subdistricts = JSON.parse(subData);
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      data: {
        province,
        districts,
        subdistricts,
      },
    });
  } catch (error: any) {
    console.error("Boundaries API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load boundaries" },
      { status: 500 }
    );
  }
}

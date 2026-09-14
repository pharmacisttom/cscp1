import { NextRequest, NextResponse } from "next/server";
import * as path from "path";
import * as fs from "fs/promises";
import * as crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files uploaded" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "inspections");
    await fs.mkdir(uploadDir, { recursive: true });

    const uploadedResults: {
      fileUrl: string;
      fileName: string;
      fileType: "PDF" | "IMAGE" | "DOCUMENT";
      fileSize: number;
    }[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const originalName = file.name;
      const ext = path.extname(originalName).toLowerCase();
      const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
      const safeFileName = `${uniqueSuffix}${ext}`;
      const filePath = path.join(uploadDir, safeFileName);

      await fs.writeFile(filePath, buffer);

      let fileType: "PDF" | "IMAGE" | "DOCUMENT" = "DOCUMENT";
      if (ext === ".pdf") {
        fileType = "PDF";
      } else if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
        fileType = "IMAGE";
      }

      uploadedResults.push({
        fileUrl: `/uploads/inspections/${safeFileName}`,
        fileName: originalName,
        fileType,
        fileSize: file.size,
      });
    }

    return NextResponse.json({
      success: true,
      data: uploadedResults,
    });
  } catch (error: any) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}

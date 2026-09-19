import { NextRequest, NextResponse } from "next/server";
import { canUseDistrictModuleFromHeaders } from "@/lib/district-access";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  if (!(await canUseDistrictModuleFromHeaders(request.headers, "dataQuality"))) {
    return NextResponse.json({ success: false, error: "โมดูลคุณภาพข้อมูลยังไม่เปิดใช้งานสำหรับอำเภอนี้" }, { status: 403 });
  }
  try {
    const userRole = request.headers.get("x-user-role");
    const rawDistrict = request.headers.get("x-user-district");
    const userDistrict = rawDistrict ? decodeURIComponent(rawDistrict) : "ALL";
    const userEmail = request.headers.get("x-user-id"); // Simplified, just an ID string

    // Validate Auth
    if (!userRole) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { rows, fileName } = await request.json();

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: "No data rows provided" }, { status: 400 });
    }

    // Get Organization
    const org = await prisma.organization.findFirst({
      where: { slug: "rayong-health" },
    });

    if (!org) {
      return NextResponse.json({ success: false, error: "Organization not found" }, { status: 500 });
    }

    // Pre-fetch Business Types
    const businessTypes = await prisma.businessType.findMany();
    const typeMap = new Map(businessTypes.map(t => [t.code, t.id]));

    // Prepare Results Tracking
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const errors: any[] = [];

    // Create Import Job
    const job = await prisma.importJob.create({
      data: {
        organizationId: org.id,
        fileName: fileName || "upload.csv",
        fileType: "CSV",
        totalRows: rows.length,
        uploaderEmail: userEmail || "unknown",
        status: "PROCESSING",
      }
    });

    // Process Rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +1 for 0-index, +1 for header

      try {
        const business_name = row["ชื่อสถานประกอบการ"];
        const business_type_code = row["ประเภทสถานประกอบการ"] || "OTHER";
        const subdistrict = row["ตำบล"];
        const district = row["อำเภอ"];
        const license_no = row["รหัส/เลขที่ใบอนุญาต"];
        const expire_year = row["ปีที่หมดอายุ (พ.ศ.)"];
        const gps = row["พิกัด GPS"];
        const phone = row["เบอร์โทรศัพท์"];
        const address = row["บ้านเลขที่/หมู่ที่"];
        
        // Metadata fields
        const owner = row["ชื่อผู้รับอนุญาต"];
        const manager = row["ชื่อผู้ดำเนินการ"];
        const openHours = row["เวลาเปิดทำการ"];

        // 1. Validate Required Fields
        if (!business_name || !district) {
          throw new Error("Missing required fields (business_name, district)");
        }

        // 2. Enforce RBAC (District Admin can only import for their own district)
        if (!isAdmin(userRole) && district !== userDistrict) {
          throw new Error(`Permission Denied: Cannot import data for ${district}`);
        }

        // 3. Resolve Business Type
        const typeId = typeMap.get(business_type_code);
        if (!typeId) {
          throw new Error(`Unknown business type code: ${business_type_code}`);
        }

        // 4. Check for duplicates (by name + district or license_no)
        const duplicate = await prisma.business.findFirst({
          where: {
            organizationId: org.id,
            name: business_name,
            location: {
              district: district
            }
          }
        });

        if (duplicate) {
          skippedCount++;
          continue; // Skip silently or we could add to a warnings array
        }

        if (license_no) {
          const dupLicense = await prisma.businessLicense.findFirst({
            where: { licenseNo: license_no }
          });
          if (dupLicense) {
            skippedCount++;
            continue;
          }
        }

        // 5. Parse Dates & Coordinates
        let lat = null;
        let lng = null;
        if (gps && typeof gps === "string" && gps.includes(",")) {
          const parts = gps.split(",");
          lat = parseFloat(parts[0].trim());
          lng = parseFloat(parts[1].trim());
          if (isNaN(lat) || isNaN(lng)) {
            lat = null;
            lng = null;
          }
        }

        let parsedExpireDate = null;
        if (expire_year) {
          const year = parseInt(expire_year);
          if (!isNaN(year)) {
            const normalizedYear = year > 2500 ? year - 543 : year; // Convert BE to CE
            parsedExpireDate = new Date(`${normalizedYear}-12-31`);
          }
        }

        // 6. Create Records in Transaction
        await prisma.$transaction(async (tx) => {
          const newBusiness = await tx.business.create({
            data: {
              organizationId: org.id,
              businessTypeId: typeId,
              name: business_name,
              phone: phone || null,
              status: "ACTIVE",
              inspectionStatus: "PENDING",
              metadata: {
                owner: owner || null,
                manager: manager || null,
                openHours: openHours || null
              }
            }
          });

          await tx.businessLocation.create({
            data: {
              businessId: newBusiness.id,
              address: address || null,
              subdistrict: subdistrict || "ไม่ระบุ",
              district: district,
              province: "ระยอง",
              latitude: lat,
              longitude: lng,
              coordinateSource: lat ? "IMPORT" : "NONE",
            }
          });

          if (license_no) {
            await tx.businessLicense.create({
              data: {
                businessId: newBusiness.id,
                licenseNo: license_no,
                expireDate: parsedExpireDate,
              }
            });
          }
        });

        successCount++;
        
      } catch (err: any) {
        failedCount++;
        errors.push({
          row: rowNum,
          name: row.business_name || "Unknown",
          reason: err.message
        });
      }
    }

    // Update Import Job
    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        successRows: successCount,
        failedRows: failedCount,
        skippedRows: skippedCount,
        status: "COMPLETED",
        summary: errors,
      }
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: rows.length,
        successRows: successCount,
        skippedRows: skippedCount,
        failedRows: failedCount,
        errors
      }
    });

  } catch (error: any) {
    console.error("Import API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process import" }, { status: 500 });
  }
}

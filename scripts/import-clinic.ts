import { prisma } from "../src/lib/prisma";
import xlsxPkg from "xlsx";
const XLSX = (xlsxPkg as any).default || xlsxPkg;
import * as path from "path";
import * as fs from "fs";
import { parseCoordinates } from "../src/lib/maps/coordinates";
import { calculateGeoEpiRisk } from "../src/lib/risk/engine";

const DEFAULT_DISTRICT = "ปลวกแดง";
const DEFAULT_PROVINCE = "ระยอง";

interface SheetMappingConfig {
  typeName: string;
  category: string;
  mapRow: (row: Record<string, any>) => {
    name: string;
    licenseNo: string;
    oldLicenseNo?: string;
    licenseeName?: string;
    operatorName?: string;
    professionalLicenseNo?: string;
    address: string;
    subdistrict: string;
    district: string;
    province: string;
    phone?: string;
    openingHours?: string;
    wasteManagement?: string;
    medicalEquipment?: string;
    note?: string;
    expireYear?: string;
    rawCoordinates?: string;
    images?: { category: string; url: string }[];
  };
}

const SHEET_CONFIGS: Record<string, SheetMappingConfig> = {
  สถานพยาบาล: {
    typeName: "คลินิก / สถานพยาบาล",
    category: "HEALTH_SERVICE",
    mapRow: (row) => ({
      name: String(row["name"] || "").trim(),
      licenseNo: String(row["รหัสคลินิก"] || "").trim(),
      oldLicenseNo: String(row["รหัสคลินิกเดิม"] || "").trim(),
      licenseeName: String(row["ผู้รับอนุญาต"] || "").trim(),
      operatorName: String(row["ผู้ดำเนินการ"] || "").trim(),
      professionalLicenseNo: String(row["เลขที่ใบประกอบวิชาชีพ"] || "").trim(),
      address: String(row["ที่อยู่"] || "").trim(),
      subdistrict: normalizeSubdistrict(String(row["ตำบล"] || "")),
      district: String(row["อำเภอ"] || DEFAULT_DISTRICT).trim(),
      province: DEFAULT_PROVINCE,
      phone: String(row["โทรศัพท์ติดต่อ"] || "").trim(),
      openingHours: String(row["เวลาเปิดทำการ"] || "").trim(),
      wasteManagement: String(row["แหล่งกำจัดขยะติดเชื้อ"] || "").trim(),
      expireYear: String(row["วันที่หมดอายุปัจจุบัน"] || row["วันที่หมดอายุ"] || "").trim(),
      note: String(row["ข้อเพิ่มเติม"] || "").trim(),
      medicalEquipment: String(row["เครื่องมือแพทย์หรือกิจกรรมที่เพิ่มเติม"] || "").trim(),
      rawCoordinates: String(row["พิกัดคลินิก"] || row["พิกัด"] || "").trim(),
      images: [
        { category: "FRONT", url: String(row["รูปคลินิก"] || "").trim() },
        { category: "INSIDE_1", url: String(row["รูปภายในคลินิก"] || "").trim() },
        { category: "INSIDE_2", url: String(row["รูปภายในคลินิก2"] || "").trim() },
        { category: "SPECIFIC", url: String(row["รูปในห้องตรวจ"] || "").trim() },
      ].filter((img) => img.url.length > 5),
    }),
  },
  น้ำบริโภค: {
    typeName: "สถานที่ผลิตน้ำดื่ม",
    category: "HEALTH_PRODUCT",
    mapRow: (row) => {
      const addrParts = [
        row["เลขที่"] ? `เลขที่ ${row["เลขที่"]}` : "",
        row["หมู่"] ? `หมู่ ${row["หมู่"]}` : "",
        row["ซอย"] ? `ซอย ${row["ซอย"]}` : "",
        row["ถนน"] ? `ถนน ${row["ถนน"]}` : "",
      ]
        .filter(Boolean)
        .join(" ");

      return {
        name: String(row["ชื่อสถานประกอบการ"] || "").trim(),
        licenseNo: String(row["เลขสถานที่"] || "").trim(),
        operatorName: String(row["ผู้ดำเนินกิจการ"] || "").trim(),
        address: addrParts || "ปลวกแดง",
        subdistrict: normalizeSubdistrict(String(row["ตำบล"] || "")),
        district: String(row["อำเภอ"] || DEFAULT_DISTRICT).trim(),
        province: DEFAULT_PROVINCE,
        phone: String(row["เบอร์โทรศัพท์"] || "").trim(),
        note: String(row["หมายเหตุ"] || "").trim(),
        medicalEquipment: String(row["อาหารที่ผลิต"] || "").trim(),
        rawCoordinates: String(row["พิกัด"] || "").trim(),
        images: [
          { category: "FRONT", url: String(row["รูปหน้าสถานที่ผลิต"] || "").trim() },
          { category: "INSIDE_1", url: String(row["รูปภายใน1"] || "").trim() },
          { category: "INSIDE_2", url: String(row["รูปภายใน2"] || "").trim() },
          { category: "SPECIFIC", url: String(row["รูปภายนอกรอบอาคาร"] || "").trim() },
        ].filter((img) => img.url.length > 5),
      };
    },
  },
  สถานที่อาหาร: {
    typeName: "สถานที่ผลิตอาหาร",
    category: "HEALTH_PRODUCT",
    mapRow: (row) => {
      const addrParts = [
        row["เลขที่"] ? `เลขที่ ${row["เลขที่"]}` : "",
        row["หมู่"] ? `หมู่ ${row["หมู่"]}` : "",
        row["ซอย"] ? `ซอย ${row["ซอย"]}` : "",
        row["ถนน"] ? `ถนน ${row["ถนน"]}` : "",
      ]
        .filter(Boolean)
        .join(" ");

      return {
        name: String(row["ชื่อสถานประกอบการ"] || "").trim(),
        licenseNo: String(row["เลขสถานที่"] || "").trim(),
        operatorName: String(row["ผู้ดำเนินกิจการ"] || "").trim(),
        address: addrParts || "ปลวกแดง",
        subdistrict: normalizeSubdistrict(String(row["ตำบล"] || "")),
        district: String(row["อำเภอ"] || DEFAULT_DISTRICT).trim(),
        province: DEFAULT_PROVINCE,
        phone: String(row["เบอร์โทรศัพท์"] || "").trim(),
        note: String(row["หมายเหตุ"] || row["หมายเหต"] || "").trim(),
        medicalEquipment: String(row["อาหารที่ผลิต"] || "").trim(),
        rawCoordinates: String(row["พิกัด"] || "").trim(),
        images: [
          { category: "FRONT", url: String(row["รูปหน้าที่ผลิต"] || "").trim() },
          { category: "INSIDE_1", url: String(row["รูปภายในสถานที่ผลิต1"] || "").trim() },
          { category: "INSIDE_2", url: String(row["รูปภายในสถานที่ผลิต2"] || "").trim() },
          { category: "SPECIFIC", url: String(row["รูปบริเวณโดยรอบ"] || "").trim() },
        ].filter((img) => img.url.length > 5),
      };
    },
  },
  ร้านขายยา: {
    typeName: "ร้านขายยา",
    category: "HEALTH_PRODUCT",
    mapRow: (row) => ({
      name: String(row["ชื่อสถานประกอบการ"] || "").trim(),
      licenseNo: String(row["ใบอนุญาตเลขที่"] || "").trim(),
      address: String(row["ที่อยู่"] || "").trim(),
      subdistrict: normalizeSubdistrict(extractSubdistrict(String(row["ที่อยู่"] || ""))),
      district: DEFAULT_DISTRICT,
      province: DEFAULT_PROVINCE,
      openingHours: String(row["เวลาปฏิบัติการ"] || "").trim(),
      operatorName: String(row["ชื่อผู้มีหน้าที่ปฏิบัติการ"] || "").trim(),
      licenseeName: String(row["ชื่อผู้ดำเนินการ"] || "").trim(),
      rawCoordinates: String(row["ที่ตั้ง"] || "").includes(",") ? String(row["ที่ตั้ง"]).trim() : "",
      note: String(row["บันทึกขณะตรวจ"] || "").trim(),
      images: [
        { category: "FRONT", url: String(row["รูปหน้าร้าน"] || "").trim() },
        { category: "INSIDE_1", url: String(row["รูป1"] || "").trim() },
        { category: "INSIDE_2", url: String(row["รูป2"] || "").trim() },
        { category: "SPECIFIC", url: String(row["รูป3"] || "").trim() },
      ].filter((img) => img.url.length > 5),
    }),
  },
  GRDU: {
    typeName: "ร้านชำ / ร้านค้าชุมชน",
    category: "COMMUNITY_STORE",
    mapRow: (row) => {
      const addrParts = [
        row["addr"] ? String(row["addr"]) : "",
        row["moo"] ? `หมู่ ${row["moo"]}` : "",
        row["moobaan"] ? `หมู่บ้าน ${row["moobaan"]}` : "",
      ]
        .filter(Boolean)
        .join(" ");

      return {
        name: String(row["company"] || "").trim(),
        licenseNo: String(row["customer_cid"] || "").trim(),
        licenseeName: String(row["customer"] || "").trim(),
        address: addrParts || "ปลวกแดง",
        subdistrict: normalizeSubdistrict(String(row["tmppart"] || "")),
        district: String(row["amppart"] || DEFAULT_DISTRICT).trim(),
        province: String(row["chwpart"] || DEFAULT_PROVINCE).trim(),
        phone: String(row["tel"] || "").trim(),
        rawCoordinates: String(row["พิกัด"] || row["map"] || "").trim(),
        images: [
          { category: "FRONT", url: String(row["image"] || "").trim() },
          { category: "INSIDE_1", url: String(row["image1"] || "").trim() },
          { category: "INSIDE_2", url: String(row["image2"] || "").trim() },
        ].filter((img) => img.url.length > 5),
      };
    },
  },
};

function normalizeSubdistrict(raw: string): string {
  let sub = raw.replace(/ต\.|ตำบล/g, "").trim();
  if (!sub) return "ปลวกแดง";

  const standardSubdistricts = [
    "ปลวกแดง",
    "ตาสิทธิ์",
    "ละหาร",
    "แม่น้ำคู้",
    "มาบยางพร",
    "หนองไร่",
  ];

  for (const std of standardSubdistricts) {
    if (sub.includes(std)) return std;
  }
  return sub || "ปลวกแดง";
}

function extractSubdistrict(text: string): string {
  const match = text.match(/ต\.\s*([^\s,]+)|ตำบล\s*([^\s,]+)/);
  if (match) {
    return match[1] || match[2] || "ปลวกแดง";
  }
  return "ปลวกแดง";
}

async function runImport() {
  console.log("🚀 Starting CSCP GeoEpi Data Migration Pipeline...");

  const filePath = path.resolve(process.cwd(), "clinicpdh.xlsx");
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Source file not found: ${filePath}`);
    process.exit(1);
  }

  // Find or create default Organization
  let org = await prisma.organization.findFirst({
    where: { slug: "pluakdaeng-health" },
  });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        slug: "pluakdaeng-health",
        name: "สำนักงานสาธารณสุขอำเภอปลวกแดง",
        province: DEFAULT_PROVINCE,
        district: DEFAULT_DISTRICT,
      },
    });
  }

  // Create ImportJob record
  const job = await prisma.importJob.create({
    data: {
      organizationId: org.id,
      fileName: "clinicpdh.xlsx",
      fileType: "XLSX",
      status: "PROCESSING",
      uploaderEmail: "admin@cscp.local",
    },
  });

  const workbook = XLSX.readFile(filePath);
  console.log("📂 Sheet names found:", workbook.SheetNames);

  let totalRows = 0;
  let successRows = 0;
  let failedRows = 0;
  let skippedRows = 0;

  for (const sheetName of workbook.SheetNames) {
    const config = SHEET_CONFIGS[sheetName];
    if (!config) {
      console.log(`ℹ️ Skipping non-mapped sheet: ${sheetName}`);
      continue;
    }

    console.log(`\n📋 Processing Sheet: [${sheetName}] -> [${config.typeName}]`);
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
    console.log(`   Found ${rawData.length} rows`);

    // Ensure BusinessType exists
    let businessType = await prisma.businessType.findFirst({
      where: { name: config.typeName },
    });
    if (!businessType) {
      businessType = await prisma.businessType.create({
        data: {
          name: config.typeName,
          code: `TYPE_${Date.now()}`,
          category: config.category,
          baseRisk: 20.0,
        },
      });
    }

    let rowIndex = 0;
    for (const row of rawData) {
      rowIndex++;
      totalRows++;

      try {
        const mapped = config.mapRow(row);
        if (!mapped.name && !mapped.licenseNo) {
          skippedRows++;
          continue;
        }

        const businessName = mapped.name || `สถานประกอบการ (${mapped.licenseNo})`;

        // Parse coordinates
        const parsedCoords = parseCoordinates(mapped.rawCoordinates);

        // Calculate initial risk
        const riskResult = calculateGeoEpiRisk({
          businessTypeBaseRisk: businessType.baseRisk,
          missingOrInvalidGps: !parsedCoords.isValid,
        });

        // Upsert Business
        let existingBusiness = null;
        if (mapped.licenseNo) {
          const license = await prisma.businessLicense.findFirst({
            where: { licenseNo: mapped.licenseNo },
            include: { business: true },
          });
          if (license) existingBusiness = license.business;
        }

        if (!existingBusiness) {
          existingBusiness = await prisma.business.findFirst({
            where: {
              organizationId: org.id,
              name: businessName,
              businessTypeId: businessType.id,
            },
          });
        }

        let business;
        if (existingBusiness) {
          business = await prisma.business.update({
            where: { id: existingBusiness.id },
            data: {
              name: businessName,
              phone: mapped.phone || existingBusiness.phone,
              openingHours: mapped.openingHours || existingBusiness.openingHours,
              wasteManagement: mapped.wasteManagement || existingBusiness.wasteManagement,
              medicalEquipment: mapped.medicalEquipment || existingBusiness.medicalEquipment,
              notes: mapped.note || existingBusiness.notes,
              riskScore: riskResult.score,
              riskLevel: riskResult.level,
              lastRiskCalculatedAt: new Date(),
            },
          });
        } else {
          business = await prisma.business.create({
            data: {
              organizationId: org.id,
              businessTypeId: businessType.id,
              name: businessName,
              phone: mapped.phone || null,
              openingHours: mapped.openingHours || null,
              wasteManagement: mapped.wasteManagement || null,
              medicalEquipment: mapped.medicalEquipment || null,
              notes: mapped.note || null,
              riskScore: riskResult.score,
              riskLevel: riskResult.level,
              lastRiskCalculatedAt: new Date(),
            },
          });
        }

        // Upsert Location
        await prisma.businessLocation.upsert({
          where: { businessId: business.id },
          update: {
            address: mapped.address || null,
            subdistrict: mapped.subdistrict,
            district: mapped.district,
            province: mapped.province,
            latitude: parsedCoords.latitude,
            longitude: parsedCoords.longitude,
            coordinateSource: parsedCoords.isValid ? "IMPORT" : "MANUAL",
            verified: false,
            geocodeStatus: parsedCoords.isValid ? "SUCCESS" : "FAILED",
          },
          create: {
            businessId: business.id,
            address: mapped.address || null,
            subdistrict: mapped.subdistrict,
            district: mapped.district,
            province: mapped.province,
            latitude: parsedCoords.latitude,
            longitude: parsedCoords.longitude,
            coordinateSource: parsedCoords.isValid ? "IMPORT" : "MANUAL",
            verified: false,
            geocodeStatus: parsedCoords.isValid ? "SUCCESS" : "FAILED",
          },
        });

        // Upsert License
        if (mapped.licenseNo) {
          const existingLic = await prisma.businessLicense.findFirst({
            where: { businessId: business.id, licenseNo: mapped.licenseNo },
          });

          if (!existingLic) {
            await prisma.businessLicense.create({
              data: {
                businessId: business.id,
                licenseNo: mapped.licenseNo,
                oldLicenseNo: mapped.oldLicenseNo || null,
                licenseeName: mapped.licenseeName || null,
                operatorName: mapped.operatorName || null,
                professionalLicenseNo: mapped.professionalLicenseNo || null,
                expireYearText: mapped.expireYear || null,
                status: "ACTIVE",
              },
            });
          }
        }

        // Add Images
        if (mapped.images && mapped.images.length > 0) {
          for (const img of mapped.images) {
            await prisma.businessImage.create({
              data: {
                businessId: business.id,
                imageUrl: img.url,
                category: img.category,
              },
            });
          }
        }

        // Create RiskSnapshot
        await prisma.riskSnapshot.create({
          data: {
            businessId: business.id,
            riskScore: riskResult.score,
            riskLevel: riskResult.level,
            algorithmVersion: riskResult.algorithmVersion,
            factorBreakdown: JSON.parse(JSON.stringify(riskResult.factors)),
            neighborhoodRisk: 0.0,
          },
        });

        // Check for DataQualityIssue
        if (!parsedCoords.isValid) {
          await prisma.dataQualityIssue.create({
            data: {
              businessId: business.id,
              importJobId: job.id,
              issueType: "MISSING_GPS",
              severity: "MEDIUM",
              description: `ไม่มีพิกัด GPS หรือพิกัดไม่สมบูรณ์ (${parsedCoords.errorReason}) สำหรับ ${businessName}`,
            },
          });
        }

        // Record ImportRow
        await prisma.importRow.create({
          data: {
            jobId: job.id,
            sheetName,
            rowNumber: rowIndex,
            businessName,
            licenseNo: mapped.licenseNo || null,
            status: parsedCoords.isValid ? "SUCCESS" : "WARNING",
            rawData: row,
          },
        });

        successRows++;
      } catch (err: any) {
        failedRows++;
        console.error(`   ❌ Error on row ${rowIndex}:`, err?.message || err);
        await prisma.importRow.create({
          data: {
            jobId: job.id,
            sheetName,
            rowNumber: rowIndex,
            status: "ERROR",
            rawData: row,
            errorMessage: String(err?.message || err),
          },
        });
      }
    }
  }

  // Update ImportJob summary
  await prisma.importJob.update({
    where: { id: job.id },
    data: {
      totalRows,
      successRows,
      failedRows,
      skippedRows,
      status: "COMPLETED",
      summary: {
        totalRows,
        successRows,
        failedRows,
        skippedRows,
        completedAt: new Date().toISOString(),
      },
    },
  });

  console.log("\n==========================================");
  console.log("🎉 DATA MIGRATION PIPELINE FINISHED!");
  console.log(`   Total Processed: ${totalRows}`);
  console.log(`   Success:         ${successRows}`);
  console.log(`   Failed:          ${failedRows}`);
  console.log(`   Skipped:         ${skippedRows}`);
  console.log("==========================================\n");
}

runImport()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

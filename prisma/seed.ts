import { prisma } from "../src/lib/prisma";
import * as crypto from "crypto";

// Hash password with standard salt or Argon2
function hashPasswordSimple(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("🌱 Starting CSCP GeoEpi Database Seeding...");

  // 1. Create Default Organization
  const org = await prisma.organization.upsert({
    where: { slug: "pluakdaeng-health" },
    update: {},
    create: {
      slug: "pluakdaeng-health",
      name: "สำนักงานสาธารณสุขอำเภอปลวกแดง",
      province: "ระยอง",
      district: "ปลวกแดง",
      active: true,
    },
  });
  console.log(`✅ Organization created/verified: ${org.name}`);

  // 2. Create Roles
  const roles = [
    { name: "SUPER_ADMIN", description: "ผู้ดูแลระบบสูงสุด (System Superadmin)" },
    { name: "ADMIN", description: "ผู้ดูแลระบบระดับอำเภอ / จังหวัด" },
    { name: "DISTRICT_MANAGER", description: "ผู้บริหารและหัวหน้ากลุ่มงานคุ้มครองผู้บริโภค" },
    { name: "INSPECTOR", description: "พนักงานเจ้าหน้าที่ผู้ตรวจประเมินหน้างาน" },
    { name: "ANALYST", description: "นักวิชาการระบาดวิทยาและวิเคราะห์ข้อมูลเชิงพื้นที่" },
    { name: "VIEWER", description: "ผู้ใช้งานทั่วไป / หน่วยงานร่วมสังเกตการณ์" },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: r.name,
        },
      },
      update: { description: r.description },
      create: {
        organizationId: org.id,
        name: r.name,
        description: r.description,
      },
    });
  }
  console.log("✅ Roles seeded");

  // 3. Create Default Admin User
  const adminRole = await prisma.role.findFirst({
    where: { organizationId: org.id, name: "ADMIN" },
  });

  const passwordHash = hashPasswordSimple("Admin@123456");
  const adminUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: org.id,
        email: "admin@cscp.local",
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      email: "admin@cscp.local",
      passwordHash,
      firstName: "เจ้าหน้าที่",
      lastName: "คุ้มครองผู้บริโภค",
      displayName: "ผู้ดูแลระบบ CSCP ปลวกแดง",
      status: "ACTIVE",
    },
  });

  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });
  }
  console.log(`✅ Default admin created: ${adminUser.email}`);

  // 4. Create Default Business Types
  const businessTypes = [
    {
      name: "คลินิก / สถานพยาบาล",
      code: "CLINIC",
      category: "HEALTH_SERVICE",
      baseRisk: 25.0,
      inspectionIntervalDays: 365,
      icon: "Stethoscope",
    },
    {
      name: "ร้านขายยา",
      code: "PHARMACY",
      category: "HEALTH_PRODUCT",
      baseRisk: 20.0,
      inspectionIntervalDays: 365,
      icon: "Pill",
    },
    {
      name: "สถานที่ผลิตอาหาร",
      code: "FOOD_FACTORY",
      category: "HEALTH_PRODUCT",
      baseRisk: 20.0,
      inspectionIntervalDays: 365,
      icon: "Utensils",
    },
    {
      name: "สถานที่ผลิตน้ำดื่ม",
      code: "WATER_FACTORY",
      category: "HEALTH_PRODUCT",
      baseRisk: 22.0,
      inspectionIntervalDays: 180,
      icon: "Droplets",
    },
    {
      name: "ร้านชำ / ร้านค้าชุมชน",
      code: "GROCERY",
      category: "COMMUNITY_STORE",
      baseRisk: 10.0,
      inspectionIntervalDays: 365,
      icon: "ShoppingBag",
    },
  ];

  for (const bt of businessTypes) {
    const createdType = await prisma.businessType.upsert({
      where: { name: bt.name },
      update: {
        code: bt.code,
        category: bt.category,
        baseRisk: bt.baseRisk,
        inspectionIntervalDays: bt.inspectionIntervalDays,
        icon: bt.icon,
      },
      create: bt,
    });

    // 5. Create default dynamic inspection template for each business type
    const existingTemplate = await prisma.inspectionTemplate.findFirst({
      where: { businessTypeId: createdType.id },
    });

    if (!existingTemplate) {
      const template = await prisma.inspectionTemplate.create({
        data: {
          businessTypeId: createdType.id,
          title: `แบบตรวจประเมินมาตรฐาน ${bt.name}`,
          description: `เกณฑ์การตรวจประเมินมาตรฐานสุขอนามัยและความปลอดภัยด้านผลิตภัณฑ์สุขภาพระดับอำเภอ`,
          isActive: true,
          versions: {
            create: {
              version: 1,
              status: "ACTIVE",
              sections: {
                create: [
                  {
                    title: "หมวดที่ 1: ความถูกต้องของใบอนุญาตและผู้มีหน้าที่ปฏิบัติการ",
                    sortOrder: 1,
                    questions: {
                      create: [
                        {
                          questionText: "มีใบอนุญาตประกอบกิจการถูกต้องและยังไม่หมดอายุ",
                          questionType: "BOOLEAN",
                          weight: 1.0,
                          isCritical: true,
                          sortOrder: 1,
                        },
                        {
                          questionText: "มีผู้ประกอบวิชาชีพ/ผู้ดำเนินการปฏิบัติหน้าที่ตามเวลาที่แจ้ง",
                          questionType: "BOOLEAN",
                          weight: 1.0,
                          isCritical: true,
                          sortOrder: 2,
                        },
                      ],
                    },
                  },
                  {
                    title: "หมวดที่ 2: สุขลักษณะ สถานที่ และเครื่องมืออุปกรณ์",
                    sortOrder: 2,
                    questions: {
                      create: [
                        {
                          questionText: "สถานที่สะอาด มีการจัดวางเป็นสัดส่วน ปราศจากสิ่งปนเปื้อน",
                          questionType: "BOOLEAN",
                          weight: 1.0,
                          isCritical: false,
                          sortOrder: 1,
                        },
                        {
                          questionText: "มีการจัดการขยะติดเชื้อหรือขยะอันตรายตามมาตรฐานสาธารณสุข",
                          questionType: "BOOLEAN",
                          weight: 1.5,
                          isCritical: true,
                          sortOrder: 2,
                        },
                        {
                          questionText: "เครื่องมืออุปกรณ์และระบบควบคุมอุณหภูมิอยู่ในสภาพพร้อมใช้งาน",
                          questionType: "BOOLEAN",
                          weight: 1.0,
                          isCritical: false,
                          sortOrder: 3,
                        },
                      ],
                    },
                  },
                  {
                    title: "หมวดที่ 3: คุณภาพผลิตภัณฑ์และการปฏิบัติตามกฎหมาย",
                    sortOrder: 3,
                    questions: {
                      create: [
                        {
                          questionText: "ไม่พบยา อาหาร หรือผลิตภัณฑ์สุขภาพหมดอายุหรือผิดกฎหมาย",
                          questionType: "BOOLEAN",
                          weight: 2.0,
                          isCritical: true,
                          sortOrder: 1,
                        },
                        {
                          questionText: "มีบันทึกรายงานและการจัดเก็บเอกสารอย่างถูกต้องตรวจสอบได้",
                          questionType: "BOOLEAN",
                          weight: 1.0,
                          isCritical: false,
                          sortOrder: 2,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      });
      console.log(`✅ Inspection template created for: ${bt.name}`);
    }
  }

  // 6. Seed System Settings
  await prisma.systemSetting.upsert({
    where: {
      scope_key: {
        scope: "GLOBAL",
        key: "GSIE_WEIGHTS",
      },
    },
    update: {},
    create: {
      scope: "GLOBAL",
      key: "GSIE_WEIGHTS",
      value: {
        individualRisk: 0.35,
        spatialHotspot: 0.15,
        inspectionOverdue: 0.15,
        complaintUrgency: 0.1,
        licenseUrgency: 0.1,
        followupUrgency: 0.1,
        geographicEfficiency: 0.05,
      },
    },
  });

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

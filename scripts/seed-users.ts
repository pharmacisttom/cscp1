import { prisma } from "../src/lib/prisma";
import * as argon2 from "argon2";

async function main() {
  console.log("Seeding Roles and Users for RBAC...");

  // Ensure organization exists
  let org = await prisma.organization.findFirst({
    where: { slug: "rayong-health" },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        slug: "rayong-health",
        name: "สำนักงานสาธารณสุขจังหวัดระยอง",
        province: "ระยอง",
      },
    });
  }

  // Create Roles
  const roles = [
    { name: "PROVINCE_ADMIN", description: "Admin at Province Level (SSJ)" },
    { name: "DISTRICT_ADMIN", description: "Admin at District Level (SSO)" },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: r.name,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        name: r.name,
        description: r.description,
      },
    });
  }

  const provAdminRole = await prisma.role.findFirst({ where: { name: "PROVINCE_ADMIN" } });
  const distAdminRole = await prisma.role.findFirst({ where: { name: "DISTRICT_ADMIN" } });

  // SSJ Admin User
  const ssjPassword = await argon2.hash("password123");
  const ssjUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: org.id,
        email: "ssj@rayong.health.go.th",
      },
    },
    update: {
      passwordHash: ssjPassword,
    },
    create: {
      organizationId: org.id,
      email: "ssj@rayong.health.go.th",
      passwordHash: ssjPassword,
      firstName: "Admin",
      lastName: "SSJ",
      displayName: "SSJ Admin",
    },
  });

  // Assign SSJ Role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: ssjUser.id,
        roleId: provAdminRole!.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: ssjUser.id,
      roleId: provAdminRole!.id,
    },
  });

  // SSO Pluak Daeng User
  const ssoPassword = await argon2.hash("password123");
  const ssoUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: org.id,
        email: "pluakdaeng@rayong.health.go.th",
      },
    },
    update: {
      passwordHash: ssoPassword,
    },
    create: {
      organizationId: org.id,
      email: "pluakdaeng@rayong.health.go.th",
      passwordHash: ssoPassword,
      firstName: "Admin",
      lastName: "PluakDaeng",
      displayName: "SSO Pluak Daeng Admin",
    },
  });

  // Create Officer record for SSO to bind to district
  await prisma.officer.upsert({
    where: {
      userId: ssoUser.id,
    },
    update: {
      district: "ปลวกแดง",
    },
    create: {
      organizationId: org.id,
      userId: ssoUser.id,
      fullName: "SSO Pluak Daeng Admin",
      district: "ปลวกแดง",
    },
  });

  // Assign SSO Role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: ssoUser.id,
        roleId: distAdminRole!.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: ssoUser.id,
      roleId: distAdminRole!.id,
    },
  });

  console.log("Seeding complete! You can now log in with:");
  console.log("1. ssj@rayong.health.go.th / password123 (Province Admin)");
  console.log("2. pluakdaeng@rayong.health.go.th / password123 (District Admin)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

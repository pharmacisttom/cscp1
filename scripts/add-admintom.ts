import { prisma } from "../src/lib/prisma";
import * as argon2 from "argon2";

async function main() {
  console.log("Creating super admin user...");

  const org = await prisma.organization.findFirst({
    where: { slug: "rayong-health" },
  });

  if (!org) {
    console.error("Organization not found!");
    process.exit(1);
  }

  const provAdminRole = await prisma.role.findFirst({
    where: { name: "PROVINCE_ADMIN" },
  });

  const password = await argon2.hash("@3560100974171");

  const superAdmin = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: org.id,
        email: "admintom", // Note: Using username as email field for login
      },
    },
    update: {
      passwordHash: password,
    },
    create: {
      organizationId: org.id,
      email: "admintom",
      passwordHash: password,
      firstName: "Admin",
      lastName: "Tom",
      displayName: "Super Admin Tom",
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.id,
        roleId: provAdminRole!.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: superAdmin.id,
      roleId: provAdminRole!.id,
    },
  });

  console.log("Super Admin user 'admintom' created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

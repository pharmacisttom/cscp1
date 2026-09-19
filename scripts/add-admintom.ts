/**
 * CSCP Super Admin Bootstrap Script
 *
 * Usage:
 *   CSCP_BOOTSTRAP_ADMIN_PASSWORD="<strong-password>" npx ts-node scripts/add-admintom.ts
 *
 * Optional env vars:
 *   CSCP_BOOTSTRAP_ORG_SLUG  — organization slug to bootstrap against
 *                              (default: "pluakdaeng-health")
 *
 * Rules:
 *  - Password is read from CSCP_BOOTSTRAP_ADMIN_PASSWORD env var only.
 *  - Password must be at least 12 characters.
 *  - Password is hashed with Argon2 and never logged.
 *  - Script is idempotent: safe to run multiple times.
 *  - If SUPER_ADMIN role is missing, the script aborts (no silent fallback).
 *  - If admintom has a legacy PROVINCE_ADMIN assignment, it is migrated to SUPER_ADMIN.
 *
 * WARNING: Never commit a real password into Git.
 * The password used during production bootstrap must be rotated if it was
 * previously committed. Mark any previously committed password as COMPROMISED.
 */

import { prisma } from "../src/lib/prisma";
import * as argon2 from "argon2";

async function main() {
  // ── 1. Read and validate password from environment ────────────────────────
  const rawPassword = process.env.CSCP_BOOTSTRAP_ADMIN_PASSWORD;

  if (!rawPassword) {
    console.error(
      "[ABORT] CSCP_BOOTSTRAP_ADMIN_PASSWORD environment variable is not set.\n" +
        "        Set it before running this script:\n" +
        "        CSCP_BOOTSTRAP_ADMIN_PASSWORD='<your-strong-password>' npx ts-node scripts/add-admintom.ts"
    );
    process.exit(1);
  }

  if (rawPassword.length < 12) {
    console.error(
      "[ABORT] CSCP_BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters long."
    );
    process.exit(1);
  }

  console.log("[bootstrap] Validating environment...");

  // ── 2. Locate the organization ────────────────────────────────────────────
  // Allow override via env var so the same script works across environments.
  const orgSlug = process.env.CSCP_BOOTSTRAP_ORG_SLUG || "pluakdaeng-health";
  console.log(`[bootstrap] Looking up organization slug: '${orgSlug}'...`);

  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug },
  });

  if (!org) {
    console.error(
      `[ABORT] Organization with slug '${orgSlug}' was not found in the database.\n` +
        `        Set CSCP_BOOTSTRAP_ORG_SLUG to the correct organization slug, or\n` +
        `        ensure the database has been seeded with the required organization data.`
    );
    process.exit(1);
  }

  console.log(`[bootstrap] Organization found: ${org.name} (id: ${org.id})`);

  // ── 3. Locate the SUPER_ADMIN role — no silent fallback ──────────────────
  const superAdminRole = await prisma.role.findFirst({
    where: { name: "SUPER_ADMIN" },
  });

  if (!superAdminRole) {
    console.error(
      "[ABORT] Role 'SUPER_ADMIN' was not found in the database.\n" +
        "        The canonical RBAC roles must exist before running this script.\n" +
        "        Do NOT fall back to PROVINCE_ADMIN or any other role."
    );
    process.exit(1);
  }

  console.log(`[bootstrap] Role SUPER_ADMIN found (id: ${superAdminRole.id})`);

  // ── 4. Hash the password — value is never stored in a variable we print ──
  console.log("[bootstrap] Hashing password with Argon2...");
  const passwordHash = await argon2.hash(rawPassword);
  // rawPassword goes out of scope after this block; never logged.

  // ── 5. Upsert the admintom user ───────────────────────────────────────────
  // User.email stores "admintom" as the login identifier (no @ required).
  const superAdmin = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: org.id,
        email: "admintom",
      },
    },
    update: {
      // Update password hash on every run so the script can also be used
      // as a password-reset tool.
      passwordHash,
    },
    create: {
      organizationId: org.id,
      email: "admintom",
      passwordHash,
      firstName: "Admin",
      lastName: "Tom",
      displayName: "Super Admin Tom",
    },
  });

  console.log(`[bootstrap] User 'admintom' ready (id: ${superAdmin.id})`);

  // ── 6. Migrate / remove legacy PROVINCE_ADMIN assignment for this user ────
  const legacyProvAdminRole = await prisma.role.findFirst({
    where: { name: "PROVINCE_ADMIN" },
  });

  if (legacyProvAdminRole) {
    const legacyAssignment = await prisma.userRole.findFirst({
      where: {
        userId: superAdmin.id,
        roleId: legacyProvAdminRole.id,
      },
    });

    if (legacyAssignment) {
      console.log(
        "[bootstrap] Legacy PROVINCE_ADMIN assignment found for admintom — removing it..."
      );
      await prisma.userRole.delete({
        where: {
          userId_roleId: {
            userId: superAdmin.id,
            roleId: legacyProvAdminRole.id,
          },
        },
      });
      console.log("[bootstrap] Legacy PROVINCE_ADMIN assignment removed.");
    }
  }

  // ── 7. Upsert SUPER_ADMIN role assignment (idempotent) ───────────────────
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: superAdmin.id,
      roleId: superAdminRole.id,
    },
  });

  console.log("[bootstrap] SUPER_ADMIN role assigned to 'admintom'.");
  console.log(
    "[bootstrap] ✓ Bootstrap complete. User 'admintom' is ready with SUPER_ADMIN role."
  );
  console.log(
    "[bootstrap] ⚠ If the previous password was committed to Git, mark it COMPROMISED and rotate it."
  );
}

main()
  .catch((e) => {
    console.error("[bootstrap] Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

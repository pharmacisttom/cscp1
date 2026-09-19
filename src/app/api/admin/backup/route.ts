import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/rbac";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireSuperAdmin(request: NextRequest) {
  const role = request.headers.get("x-user-role");
  if (!isSuperAdmin(role)) {
    return NextResponse.json(
      { success: false, error: "เฉพาะ Super Admin เท่านั้นที่สามารถ export ข้อมูลได้" },
      { status: 403 }
    );
  }
  return null;
}

function getUserId(request: NextRequest): string | null {
  return request.headers.get("x-user-id");
}

function getOrgId(request: NextRequest): string | null {
  return request.headers.get("x-user-org-id");
}

function toCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

// ─── Route Handler ────────────────────────────────────────────────────────────

/**
 * GET /api/admin/backup?scope=<scope>&format=<json|csv>
 *
 * scope:
 *   businesses   — All businesses + locations + licenses
 *   inspections  — All inspections (including confidential)
 *   users        — All users (passwordHash excluded)
 *   goals        — All goals + district goals
 *   audit        — Audit logs (last 90 days)
 *   full         — All of the above combined as JSON
 */
export async function GET(request: NextRequest) {
  const denied = requireSuperAdmin(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") || "full";
  const format = searchParams.get("format") === "csv" ? "csv" : "json";
  const orgId = getOrgId(request);
  const userId = getUserId(request);

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    let data: any;
    let filename: string;

    // ── Fetch requested scope ────────────────────────────────────────────────
    if (scope === "businesses") {
      data = await prisma.business.findMany({
        where: orgId ? { organizationId: orgId } : {},
        include: {
          businessType: { select: { name: true, code: true } },
          location: true,
          licenses: true,
        },
        orderBy: { name: "asc" },
      });
      filename = `cscp-backup-businesses-${timestamp}`;
    } else if (scope === "inspections") {
      data = await prisma.inspection.findMany({
        include: {
          business: {
            select: { name: true, businessType: { select: { name: true } } },
          },
          findings: true,
          attachments: { select: { fileName: true, fileType: true, fileUrl: true } },
        },
        orderBy: { inspectionDate: "desc" },
      });
      filename = `cscp-backup-inspections-${timestamp}`;
    } else if (scope === "users") {
      const users = await prisma.user.findMany({
        where: orgId ? { organizationId: orgId } : {},
        select: {
          id: true,
          organizationId: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          roles: { include: { role: { select: { name: true } } } },
          officer: { select: { fullName: true, district: true, position: true } },
        },
        orderBy: { createdAt: "asc" },
      });
      // Flatten roles for CSV compatibility
      data = users.map((u) => ({
        ...u,
        roles: u.roles.map((r) => r.role.name).join("|"),
        officerDistrict: u.officer?.district || "",
      }));
      filename = `cscp-backup-users-${timestamp}`;
    } else if (scope === "goals") {
      data = await prisma.goal.findMany({
        where: orgId ? { organizationId: orgId } : {},
        include: {
          businessType: { select: { name: true } },
          districtGoals: true,
        },
        orderBy: { createdAt: "desc" },
      });
      filename = `cscp-backup-goals-${timestamp}`;
    } else if (scope === "audit") {
      const since = new Date();
      since.setDate(since.getDate() - 90);
      data = await prisma.auditLog.findMany({
        where: {
          ...(orgId ? { organizationId: orgId } : {}),
          createdAt: { gte: since },
        },
        orderBy: { createdAt: "desc" },
        take: 5000,
      });
      filename = `cscp-backup-auditlog-${timestamp}`;
    } else {
      // full — all scopes as JSON only
      const [businesses, inspections, users, goals, auditLogs] = await Promise.all([
        prisma.business.findMany({
          where: orgId ? { organizationId: orgId } : {},
          include: {
            businessType: { select: { name: true, code: true } },
            location: true,
            licenses: true,
          },
        }),
        prisma.inspection.findMany({
          include: {
            business: { select: { name: true } },
            findings: true,
          },
          orderBy: { inspectionDate: "desc" },
        }),
        prisma.user.findMany({
          where: orgId ? { organizationId: orgId } : {},
          select: {
            id: true,
            email: true,
            displayName: true,
            status: true,
            createdAt: true,
            roles: { include: { role: { select: { name: true } } } },
          },
        }),
        prisma.goal.findMany({
          where: orgId ? { organizationId: orgId } : {},
          include: { districtGoals: true },
        }),
        prisma.auditLog.findMany({
          where: {
            ...(orgId ? { organizationId: orgId } : {}),
            createdAt: { gte: new Date(Date.now() - 90 * 864e5) },
          },
          orderBy: { createdAt: "desc" },
          take: 5000,
        }),
      ]);
      data = { businesses, inspections, users, goals, auditLogs };
      filename = `cscp-backup-full-${timestamp}`;
    }

    // ── Write AuditLog ────────────────────────────────────────────────────────
    await prisma.auditLog.create({
      data: {
        organizationId: orgId || undefined,
        userId: userId || undefined,
        action: "EXPORT",
        tableName: scope,
        newData: { scope, format, timestamp },
      },
    }).catch(() => {
      // Non-fatal: audit write failure should not block the download
    });

    // ── Serialize and return ─────────────────────────────────────────────────
    if (format === "csv") {
      const rows = Array.isArray(data) ? data : Object.values(data).flat() as any[];
      const csv = toCSV(
        rows.map((r: any) => {
          const flat: Record<string, any> = {};
          for (const [k, v] of Object.entries(r)) {
            flat[k] =
              v && typeof v === "object" && !Array.isArray(v)
                ? JSON.stringify(v)
                : Array.isArray(v)
                ? (v as any[]).length
                : v;
          }
          return flat;
        })
      );
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    const json = JSON.stringify(data, null, 2);
    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.json"`,
      },
    });
  } catch (error: any) {
    console.error("[backup] Export error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการ export ข้อมูล" },
      { status: 500 }
    );
  }
}

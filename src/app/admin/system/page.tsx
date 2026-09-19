"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Save,
  Settings,
  Users,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  Clock,
  ShieldAlert,
} from "lucide-react";
import {
  DISTRICT_MODULE_LABELS,
  DISTRICT_MODULES,
  RAYONG_DISTRICTS,
  defaultDistrictAccessMatrix,
  type DistrictAccessMatrix,
  type DistrictModule,
} from "@/lib/district-modules";

// ─── Backup Section ────────────────────────────────────────────────────────────

type BackupScope = "businesses" | "inspections" | "users" | "goals" | "audit" | "full";

const BACKUP_SCOPES: { key: BackupScope; label: string; description: string }[] = [
  { key: "businesses", label: "ข้อมูลสถานประกอบการ", description: "ร้านค้า + ที่อยู่ + ใบอนุญาต" },
  { key: "inspections", label: "ผลการตรวจ (ทั้งหมด)", description: "รวม confidential ทุกรายการ" },
  { key: "users", label: "ข้อมูลผู้ใช้งาน", description: "ไม่รวม password hash" },
  { key: "goals", label: "เป้าหมาย KPI", description: "Goal + DistrictGoal" },
  { key: "audit", label: "ประวัติ Audit Log", description: "90 วันล่าสุด" },
  { key: "full", label: "ข้อมูลทั้งหมด (Full Backup)", description: "ทุก scope รวมกัน — JSON เท่านั้น" },
];

function BackupSection() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<{ scope: string; time: Date } | null>(null);
  const [message, setMessage] = useState("");

  async function downloadBackup(scope: BackupScope, format: "json" | "csv") {
    if (scope === "full" && format === "csv") {
      setMessage("Full backup รองรับเฉพาะ JSON เท่านั้น");
      return;
    }
    setDownloading(`${scope}-${format}`);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/backup?scope=${scope}&format=${format}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Export ไม่สำเร็จ");
      }

      // Trigger browser download
      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition") || "";
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `cscp-backup-${scope}.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setLastExport({ scope, time: new Date() });
      setMessage(`✓ Export "${scope}" สำเร็จ — ไฟล์ถูก download แล้ว`);
    } catch (err: any) {
      setMessage(err.message || "เกิดข้อผิดพลาดในการ export");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
        <Database className="h-5 w-5 text-teal-600" />
        <div>
          <h2 className="text-base font-bold text-slate-900">สำรองข้อมูลระบบ (Backup)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Export ข้อมูลเป็น JSON หรือ CSV — เฉพาะ Super Admin
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`mx-6 mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold ${
            message.startsWith("✓")
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-amber-50 border border-amber-200 text-amber-800"
          }`}
        >
          {message}
        </div>
      )}

      {lastExport && (
        <div className="flex items-center gap-2 mx-6 mt-3 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          Export ล่าสุด: <b>{lastExport.scope}</b> เมื่อ{" "}
          {lastExport.time.toLocaleTimeString("th-TH")}
        </div>
      )}

      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BACKUP_SCOPES.map((scope) => {
          const isFull = scope.key === "full";
          return (
            <div
              key={scope.key}
              className={`rounded-xl border p-4 space-y-3 ${
                isFull
                  ? "border-teal-200 bg-teal-50/50"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              } transition-all`}
            >
              <div>
                <p className="text-sm font-bold text-slate-900">{scope.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{scope.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadBackup(scope.key, "json")}
                  disabled={!!downloading}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  {downloading === `${scope.key}-json` ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileJson className="h-3.5 w-3.5" />
                  )}
                  JSON
                </button>
                {!isFull && (
                  <button
                    onClick={() => downloadBackup(scope.key, "csv")}
                    disabled={!!downloading}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {downloading === `${scope.key}-csv` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                    )}
                    CSV
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mx-6 mb-5 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-800">
        <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>
          ข้อมูลที่ export มีข้อมูลส่วนบุคคลและข้อมูลความลับ —
          กรุณาเก็บรักษาไฟล์ backup อย่างปลอดภัยและปฏิบัติตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA)
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SystemManagementPage() {
  const [matrix, setMatrix] = useState<DistrictAccessMatrix>(defaultDistrictAccessMatrix());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/district-access")
      .then((response) => response.json())
      .then((json) => {
        if (json.success) setMatrix(json.data);
        else setMessage(json.error || "ไม่สามารถโหลดการตั้งค่าได้");
      })
      .catch(() => setMessage("ไม่สามารถเชื่อมต่อระบบตั้งค่าได้"))
      .finally(() => setLoading(false));
  }, []);

  function toggle(district: string, module: DistrictModule) {
    setMessage("");
    setMatrix((current) => ({
      ...current,
      [district]: {
        ...current[district],
        [module]: !current[district][module],
      },
    }));
  }

  function setDistrict(district: string, enabled: boolean) {
    setMatrix((current) => ({
      ...current,
      [district]: Object.fromEntries(
        DISTRICT_MODULES.map((module) => [module, enabled]),
      ) as DistrictAccessMatrix[string],
    }));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/district-access", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: matrix }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || "บันทึกไม่สำเร็จ");
      setMatrix(json.data);
      setMessage("บันทึกสิทธิ์การเปิดใช้งานของทุกอำเภอเรียบร้อยแล้ว");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-teal-600" />
            <h1 className="text-2xl font-extrabold text-slate-900">จัดการระบบตรวจระดับจังหวัด</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            เปิดหรือปิดโมดูลการตรวจสำหรับ 8 อำเภอในจังหวัดระยอง การเปลี่ยนแปลงมีผลเมื่อผู้ใช้โหลดหน้าใหม่
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <Users className="h-4 w-4" /> จัดการผู้ใช้งาน
          </Link>
          <button
            onClick={save}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl border p-3 text-sm font-semibold ${
            message.includes("เรียบร้อย")
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* District Module Access Matrix */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-16 text-sm text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />กำลังโหลดการตั้งค่า...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold text-slate-600">
                <tr>
                  <th className="p-4">หน่วยงานระดับอำเภอ</th>
                  {DISTRICT_MODULES.map((module) => (
                    <th key={module} className="p-4 text-center">
                      {DISTRICT_MODULE_LABELS[module]}
                    </th>
                  ))}
                  <th className="p-4 text-center">เปิด/ปิดทั้งหมด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {RAYONG_DISTRICTS.map((district) => {
                  const allEnabled = DISTRICT_MODULES.every((module) => matrix[district][module]);
                  return (
                    <tr key={district} className="hover:bg-slate-50/70">
                      <td className="p-4 font-bold text-slate-900">อำเภอ {district}</td>
                      {DISTRICT_MODULES.map((module) => (
                        <td key={module} className="p-4 text-center">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={matrix[district][module]}
                            onClick={() => toggle(district, module)}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                              matrix[district][module] ? "bg-teal-600" : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                matrix[district][module] ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td>
                      ))}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setDistrict(district, !allEnabled)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                            allEnabled
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {allEnabled ? (
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />เปิดทั้งหมด
                            </span>
                          ) : (
                            "เปิดทั้งหมด"
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Backup Section */}
      <BackupSection />
    </div>
  );
}

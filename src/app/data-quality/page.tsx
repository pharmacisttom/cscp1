import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Database,
  MapPinOff,
  AlertTriangle,
  Copy,
  CalendarX,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import { IssuesTabs } from "@/components/data-quality/issues-tabs";

export default async function DataQualityPage() {
  const total = await prisma.business.count();
  const withCoordinates = await prisma.businessLocation.count({
    where: { latitude: { not: null }, longitude: { not: null } },
  });
  const missingCoordinates = total - withCoordinates;

  const neverInspected = await prisma.business.count({
    where: { lastInspectionDate: null },
  });

  const issues = await prisma.dataQualityIssue.findMany({
    where: { resolved: false },
    take: 50,
    include: {
      business: {
        include: {
          businessType: true,
          location: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Data Quality Management & GPS Validation
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
              Audit Control
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            รายงานความสมบูรณ์ของข้อมูล พิกัดทางภูมิศาสตร์ และรายการที่ต้องลงตรวจสอบหน้างาน
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/data-quality/import"
            className="flex items-center gap-2 rounded-xl bg-white border border-teal-600 px-3.5 py-2 text-xs font-bold text-teal-600 shadow-sm hover:bg-teal-50"
          >
            นำเข้าข้อมูลสถานประกอบการ
          </Link>
          <Link
            href="/inspections/field"
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-teal-700"
          >
            <Smartphone className="h-4 w-4" />
            ไปที่ Field Mode เพื่อยืนยัน GPS
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold">GPS Coordinate Coverage</span>
            <MapPinOff className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {((withCoordinates / total) * 100).toFixed(1)}%
          </div>
          <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
            <span>มีพิกัดแล้ว {withCoordinates} แห่ง</span>
            <span className="text-red-600 font-bold">ขาดอีก {missingCoordinates} แห่ง</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold">Never Inspected</span>
            <CalendarX className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-3xl font-extrabold text-orange-600">
            {neverInspected}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
            <span>คิดเป็น {((neverInspected / total) * 100).toFixed(1)}%</span>
            <span>ยังไม่มีประวัติในระบบ</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold">Active Quality Issues</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600">
            {issues.length}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>รายการที่ต้องตรวจสอบพิกัด/ข้อมูลใบอนุญาต</span>
          </div>
        </div>
      </div>

      {/* Issues Tabs */}
      <IssuesTabs issues={issues} />
    </div>
  );
}

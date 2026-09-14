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

        <Link
          href="/inspections/field"
          className="flex items-center gap-2 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-teal-700"
        >
          <Smartphone className="h-4 w-4" />
          ไปที่ Field Mode เพื่อยืนยัน GPS
        </Link>
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

      {/* Issues Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-hidden">
        <h3 className="font-bold text-sm text-slate-900 mb-3">
          รายการสถานประกอบการที่ต้องตรวจสอบความสมบูรณ์ของข้อมูล ({issues.length} รายการ)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="p-3">สถานประกอบการ</th>
                <th className="p-3">ประเภท</th>
                <th className="p-3">ตำบล</th>
                <th className="p-3">ประเด็นปัญหา</th>
                <th className="p-3 text-center">ระดับความสำคัญ</th>
                <th className="p-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50/70">
                  <td className="p-3 font-bold text-slate-900">
                    {issue.business?.name || "-"}
                  </td>
                  <td className="p-3">{issue.business?.businessType.name || "-"}</td>
                  <td className="p-3">ต.{issue.business?.location?.subdistrict || "-"}</td>
                  <td className="p-3 text-slate-600">{issue.description}</td>
                  <td className="p-3 text-center">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      {issue.severity}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/inspections/field?businessId=${issue.businessId}`}
                      className="text-teal-600 font-bold hover:underline"
                    >
                      ยืนยันพิกัด
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

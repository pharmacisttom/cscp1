"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  TrendingUp,
  PieChart,
  CalendarX,
  Flame,
  CheckCircle,
  HelpCircle,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export default function SurveillancePage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadIndicators() {
      try {
        const res = await fetch("/api/surveillance/indicators");
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadIndicators();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-500 text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-3" />
        กำลังประมวลผลตัวชี้วัดระบาดวิทยาเชิงพื้นที่ (Geo-Epidemiology)...
      </div>
    );
  }

  const { metrics, counts, areas, clusters, signals, fiscalYear } = data;

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Geo-Epidemiological Surveillance
            </h1>
            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800 border border-teal-200">
              ปีงบประมาณ {fiscalYear}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ระบบเฝ้าระวังความไม่ผ่านมาตรฐาน ข้อบกพร่อง และประเมินสัญญาณความเสี่ยงเชิงพื้นที่ระดับอำเภอ
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
          <span>ความถี่วิเคราะห์: รายสัปดาห์ / รายเดือน / ปีงบประมาณ</span>
        </div>
      </div>

      {/* Surveillance Signal Banner if alerts exist */}
      {signals && signals.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-md">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                <span>Surveillance Signal Detection Alert</span>
                <span className="rounded-md bg-amber-200 px-1.5 py-0.5 text-[10px] text-amber-900">
                  {signals[0].signalType}
                </span>
              </div>
              <p className="text-amber-900/90 mt-1 leading-relaxed">
                {signals[0].message} (ตรวจจับด้วยอัลกอริทึม EWMA / CUSUM
                เพื่อเป็นสัญญาณเตือนภัยล่วงหน้า ไม่ใช่ข้อสรุปทางกฎหมาย)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Denominator-Aware Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Coverage Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold">Inspection Coverage</span>
            <PieChart className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {metrics.inspectionCoverageRate}%
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>
              ตรวจแล้ว <b>{counts.inspected}</b> แห่ง
            </span>
            <span>เป้าหมาย {counts.total} แห่ง</span>
          </div>
        </div>

        {/* Compliance Failure Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold">Compliance Failure Rate</span>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-3xl font-extrabold text-red-600">
            {metrics.complianceFailureRate}%
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>
              ไม่ผ่าน <b>{counts.failed}</b> แห่ง
            </span>
            <span>จากที่ตรวจทั้งหมด</span>
          </div>
        </div>

        {/* Complaint Rate per 100 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold">Complaint Rate per 100</span>
            <Activity className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-purple-600">
            {metrics.complaintRatePer100}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>
              ร้องเรียนสะสม <b>{counts.complaints}</b> เรื่อง
            </span>
            <span>ต่อ 100 แห่ง</span>
          </div>
        </div>

        {/* Overdue Inspection Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold">Overdue Rate</span>
            <CalendarX className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-3xl font-extrabold text-orange-600">
            {metrics.overdueRate}%
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>
              เกินกำหนด <b>{counts.overdue}</b> แห่ง
            </span>
            <span>ต้องลงตรวจเร่งด่วน</span>
          </div>
        </div>
      </div>

      {/* Spatial Hotspots & Clusters Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-red-500" />
            <h3 className="font-bold text-sm text-slate-900">
              จุดเสี่ยงหนาแน่นเชิงพื้นที่ (Spatial Hotspots via DBSCAN)
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            พบ {clusters.length} คลัสเตอร์ในอำเภอปลวกแดง
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {clusters.map((c: any) => (
            <div
              key={c.clusterId}
              className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 text-xs hover:bg-slate-100/50 transition-all"
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span className="text-slate-900">{c.clusterId}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    c.clusterRisk === "CRITICAL"
                      ? "bg-red-100 text-red-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {c.clusterRisk}
                </span>
              </div>
              <div className="text-slate-600 space-y-1 mt-2">
                <p>
                  <b>สถานประกอบการ:</b> {c.businessCount} แห่ง
                </p>
                <p>
                  <b>ความเสี่ยงเฉลี่ย:</b> {c.averageRisk} / 100
                </p>
                <p>
                  <b>พิกัดศูนย์กลาง:</b> {c.centroidLat}, {c.centroidLng}
                </p>
                <p>
                  <b>รัศมีเฝ้าระวัง:</b> ~{c.radiusMeters} เมตร
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subdistrict Comparison Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-hidden">
        <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-teal-600" />
          <span>เปรียบเทียบตัวชี้วัดระบาดวิทยารายตำบล (Subdistrict Indicators)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="p-3">ตำบล</th>
                <th className="p-3 text-right">จำนวนทั้งหมด</th>
                <th className="p-3 text-right">ตรวจแล้ว</th>
                <th className="p-3 text-right">Coverage %</th>
                <th className="p-3 text-right">ไม่ผ่าน (แห่ง)</th>
                <th className="p-3 text-right">Failure Rate %</th>
                <th className="p-3 text-right">ร้องเรียน</th>
                <th className="p-3 text-right">เกินกำหนดตรวจ</th>
                <th className="p-3 text-right">คะแนนเสี่ยงเฉลี่ย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {areas?.map((area: any) => (
                <tr key={area.areaName} className="hover:bg-slate-50/70">
                  <td className="p-3 font-bold text-slate-900">{area.areaName}</td>
                  <td className="p-3 text-right font-medium">{area.total}</td>
                  <td className="p-3 text-right">{area.inspected}</td>
                  <td className="p-3 text-right font-semibold text-teal-700">
                    {area.coverageRate}%
                  </td>
                  <td className="p-3 text-right text-red-600 font-medium">
                    {area.failed}
                  </td>
                  <td className="p-3 text-right text-red-700">
                    {area.failureRate}%
                  </td>
                  <td className="p-3 text-right text-purple-600">
                    {area.complaints}
                  </td>
                  <td className="p-3 text-right text-orange-600 font-bold">
                    {area.overdue}
                  </td>
                  <td className="p-3 text-right font-bold">
                    {area.averageRisk}
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

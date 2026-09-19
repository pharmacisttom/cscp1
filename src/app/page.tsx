"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Activity,
  ShieldAlert,
  Flame,
  AlertTriangle,
  Calendar,
  Navigation,
  ChevronRight,
  TrendingUp,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { MapMarkerItem } from "@/components/map/smart-map-view";
import { useAuth } from "@/components/auth/auth-provider";

const SmartMapView = dynamic(() => import("@/components/map/smart-map-view"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500 text-xs">
      กำลังโหลดแผนที่ศูนย์บัญชาการ...
    </div>
  ),
});

export default function CommandCenterDashboard() {
  const { user, isProvinceAdmin, isDistrictAdmin } = useAuth();
  
  const [indicators, setIndicators] = useState<any | null>(null);
  const [markers, setMarkers] = useState<MapMarkerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<"province" | "district">(isProvinceAdmin ? "province" : "district");
  const [districtName, setDistrictName] = useState(user?.district && user.district !== "ALL" ? user.district : "ปลวกแดง");

  useEffect(() => {
    // If context changes, ensure states match RBAC
    if (isDistrictAdmin && user?.district) {
      setLevel("district");
      setDistrictName(user.district);
    } else if (isProvinceAdmin && user?.district === "ALL" && level !== "district") {
      setLevel("province");
    }
  }, [user, isProvinceAdmin, isDistrictAdmin]);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [indRes, mapRes] = await Promise.all([
          fetch(`/api/surveillance/indicators?level=${level}&districtName=${districtName}`),
          fetch(`/api/map/businesses?level=${level}&districtName=${districtName}`),
        ]);
        const indJson = await indRes.json();
        const mapJson = await mapRes.json();

        if (indJson.success) setIndicators(indJson);
        if (mapJson.success) setMarkers(mapJson.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [level, districtName]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Top Quick Bar */}
      <div className="z-10 bg-white border-b border-slate-200 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse" />
            <h1 className="text-xs sm:text-sm font-bold text-slate-900">
              {level === "province" ? "Provincial Consumer Health Surveillance Command Center" : "District Consumer Health Surveillance Command Center"}
            </h1>
            <span className="text-xs text-slate-400 hidden sm:inline">•</span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              {level === "province" ? "สสจ.ระยอง" : `อำเภอ ${districtName} จ.ระยอง`}
            </span>
          </div>

          <div className="flex items-center gap-2 mr-auto ml-4">
            {isProvinceAdmin && (
              <>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="text-xs border border-slate-300 rounded-md shadow-sm p-1"
                >
                  <option value="province">สสจ.ระยอง (ภาพรวมจังหวัด)</option>
                  <option value="district">อำเภอ (ภาพรวมอำเภอ)</option>
                </select>
                {level === "district" && (
                  <select
                    value={districtName}
                    onChange={(e) => setDistrictName(e.target.value)}
                    className="text-xs border border-slate-300 rounded-md shadow-sm p-1"
                  >
                    <option value="ปลวกแดง">ปลวกแดง</option>
                    <option value="เมืองระยอง">เมืองระยอง</option>
                    <option value="บ้านค่าย">บ้านค่าย</option>
                    <option value="บ้านฉาง">บ้านฉาง</option>
                    <option value="แกลง">แกลง</option>
                    <option value="วังจันทร์">วังจันทร์</option>
                    <option value="เขาชะเมา">เขาชะเมา</option>
                    <option value="นิคมพัฒนา">นิคมพัฒนา</option>
                  </select>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <Link
              href="/plans/smart"
              className="flex items-center gap-1 text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 hover:bg-teal-100"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>สร้างแผนตรวจวันนี้ (GSIE)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Command Center Layout: 65% Map + 35% Intelligence Feeds */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map Center: 60-70% on Desktop */}
        <div className="flex-1 relative min-h-[450px] lg:h-full border-r border-slate-200">
          <SmartMapView
            markers={markers}
            clusters={indicators?.clusters || []}
          />
        </div>

        {/* Intelligence Feeds & Alerts Side Panel: ~35% */}
        <div className="w-full lg:w-[420px] bg-slate-50 flex flex-col h-full overflow-y-auto p-4 space-y-4">
          {/* Real-time Indicator Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 block">
                สถานประกอบการทั้งหมด
              </span>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                {indicators?.counts?.total || markers.length} แห่ง
              </div>
              <span className="text-[10px] text-teal-700 font-semibold">
                มีพิกัด GPS {indicators?.counts?.withGpsCount || 0} แห่ง
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 block">
                ความครอบคลุมการตรวจ
              </span>
              <div className="text-xl font-extrabold text-teal-600 mt-0.5">
                {indicators?.metrics?.inspectionCoverageRate || 0}%
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                ตรวจแล้ว {indicators?.counts?.inspected || 0} แห่ง
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 block">
                ความเสี่ยงวิกฤต (Critical)
              </span>
              <div className="text-xl font-extrabold text-red-600 mt-0.5">
                {indicators?.counts?.criticalRiskCount || 0} แห่ง
              </div>
              <span className="text-[10px] text-red-600 font-medium">
                ต้องติดตามผลด่วน
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 block">
                เรื่องร้องเรียนสะสม
              </span>
              <div className="text-xl font-extrabold text-purple-600 mt-0.5">
                {indicators?.counts?.complaints || 0} เรื่อง
              </div>
              <span className="text-[10px] text-purple-600 font-medium">
                อัตรา {indicators?.metrics?.complaintRatePer100 || 0} / 100 แห่ง
              </span>
            </div>
          </div>

          {/* Active Hotspots Feed */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-red-500" />
                จุดเสี่ยงหนาแน่นเร่งด่วน (Active Hotspots)
              </span>
              <Link
                href="/surveillance"
                className="text-[10px] font-bold text-teal-600 hover:underline flex items-center"
              >
                ดูทั้งหมด <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              {indicators?.clusters?.slice(0, 3).map((c: any) => (
                <div
                  key={c.clusterId}
                  className="rounded-lg border border-red-100 bg-red-50/40 p-2.5 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {c.clusterId} • กลุ่มสถานประกอบการ {c.businessCount} แห่ง
                    </span>
                    <span className="text-[11px] text-slate-500">
                      พิกัดศูนย์กลาง: {c.centroidLat}, {c.centroidLng}
                    </span>
                  </div>
                  <span className="font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded-full text-[10px]">
                    Risk {c.averageRisk}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Risk Areas (Subdistricts) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-teal-600" />
                {level === "province" ? "พื้นที่ความเสี่ยงสูงสุดรายอำเภอ" : "พื้นที่ความเสี่ยงสูงสุดรายตำบล"}
              </span>
              <span className="text-[10px] text-slate-400">
                {level === "province" ? "จ.ระยอง" : `อ.${districtName}`}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              {indicators?.areas?.slice(0, 4).map((area: any) => (
                <div
                  key={area.areaName}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <span className="font-medium text-slate-800">
                    {level === "province" ? `อ.${area.areaName}` : `ต.${area.areaName}`} ({area.total} แห่ง)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[11px]">
                      Coverage {area.coverageRate}%
                    </span>
                    <span className="font-bold text-amber-700">
                      Risk {area.averageRisk}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Plan Banner */}
          <div className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 p-4 text-white shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold block">
                  วันนี้พร้อมออกตรวจหน้างานหรือยัง?
                </span>
                <p className="text-[11px] text-teal-100 mt-1">
                  ระบบจัดเส้นทาง 2-opt เพื่อลดระยะทางและครอบคลุมสถานที่เสี่ยงสูงที่สุด
                </p>
              </div>
              <Link
                href="/plans/smart"
                className="shrink-0 bg-white text-teal-800 px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-teal-50"
              >
                เปิดแผนตรวจ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

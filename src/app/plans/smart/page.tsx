"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Navigation,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
  CheckCircle,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";

const SmartMapView = dynamic(() => import("@/components/map/smart-map-view"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500 text-xs">
      กำลังเตรียมแผนที่เส้นทาง...
    </div>
  ),
});

export default function SmartInspectionPlannerPage() {
  const [scenario, setScenario] = useState("BALANCED");
  const [maxStops, setMaxStops] = useState(6);
  const [subdistrict, setSubdistrict] = useState("ALL");
  const [planResult, setPlanResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const subdistricts = [
    "ALL",
    "ปลวกแดง",
    "ตาสิทธิ์",
    "ละหาร",
    "แม่น้ำคู้",
    "มาบยางพร",
    "หนองไร่",
  ];

  const scenarios = [
    { id: "BALANCED", label: "สมดุลความเสี่ยงและระยะทาง (Balanced)" },
    { id: "RISK_FIRST", label: "เน้นความเสี่ยงสูงสุดก่อน (Risk First)" },
    { id: "SHORTEST_ROUTE", label: "ระยะทางสั้นที่สุด (Shortest Route)" },
    { id: "MAX_COVERAGE", label: "ตรวจได้จำนวนมากที่สุด (Max Coverage)" },
    { id: "HOTSPOT_CONTROL", label: "ควบคุมพื้นที่จุดเสี่ยง (Hotspot Control)" },
  ];

  const generateRoutePlan = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("scenario", scenario);
      params.set("maxStops", String(maxStops));
      if (subdistrict !== "ALL") params.set("subdistrict", subdistrict);

      const res = await fetch(`/api/plans/generate?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setPlanResult(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateRoutePlan();
  }, [scenario, maxStops, subdistrict]);

  const routePath = planResult?.stops
    ? [
        { lat: planResult.startLat, lng: planResult.startLng },
        ...planResult.stops.map((s: any) => ({
          lat: s.latitude,
          lng: s.longitude,
        })),
        { lat: planResult.startLat, lng: planResult.startLng },
      ]
    : [];

  const markers = planResult?.stops
    ? planResult.stops.map((s: any) => ({
        id: s.businessId,
        name: s.businessName,
        lat: s.latitude,
        lng: s.longitude,
        subdistrict: s.subdistrict,
        type: s.businessType,
        typeCode: "CLINIC",
        riskScore: s.riskScore,
        riskLevel: s.riskLevel,
        status: "PLANNED",
        licenseNo: "-",
        isNearExpiry: false,
        hasOpenComplaint: false,
        verifiedGps: true,
        lastInspection: null,
        nextInspection: null,
      }))
    : [];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Planner Controls Bar */}
      <div className="z-10 bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 mr-2">
              <Navigation className="h-4 w-4 text-teal-600" />
              <span>GSIE Smart Route Optimizer</span>
            </div>

            {/* Scenario Selector */}
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700 focus:border-teal-500 focus:outline-none"
            >
              {scenarios.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.label}
                </option>
              ))}
            </select>

            {/* Subdistrict Filter */}
            <select
              value={subdistrict}
              onChange={(e) => setSubdistrict(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700"
            >
              {subdistricts.map((s) => (
                <option key={s} value={s}>
                  {s === "ALL" ? "ทุกตำบล" : `ต.${s}`}
                </option>
              ))}
            </select>

            {/* Max Stops */}
            <select
              value={maxStops}
              onChange={(e) => setMaxStops(parseInt(e.target.value, 10))}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700"
            >
              <option value={4}>4 จุดตรวจ / วัน</option>
              <option value={6}>6 จุดตรวจ / วัน (แนะนำ)</option>
              <option value={8}>8 จุดตรวจ / วัน</option>
            </select>
          </div>

          <button
            onClick={generateRoutePlan}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-teal-700 disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            คำนวณเส้นทางใหม่
          </button>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Smart Map */}
        <div className="flex-1 relative h-64 lg:h-full border-r border-slate-200">
          <SmartMapView
            markers={markers}
            routePath={routePath}
            stops={planResult?.stops || []}
          />
        </div>

        {/* Right Column: Daily Schedule & Why this stop */}
        <div className="w-full lg:w-[480px] bg-slate-50 flex flex-col h-full overflow-hidden">
          {/* Summary Box */}
          <div className="p-4 bg-white border-b border-slate-200 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">
                ตารางตรวจประเมินประจำวัน
              </span>
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-800">
                {planResult?.stops?.length || 0} จุดตรวจ
              </span>
            </div>

            {planResult && (
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[10px]">ระยะทางรวม</span>
                  <b className="text-slate-800 text-sm">
                    {planResult.totalDistanceKm} กม.
                  </b>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">เวลาโดยประมาณ</span>
                  <b className="text-slate-800 text-sm">
                    {Math.floor(planResult.totalDurationMinutes / 60)} ชม.{" "}
                    {planResult.totalDurationMinutes % 60} นาที
                  </b>
                </div>
              </div>
            )}
          </div>

          {/* Stops List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Start Stop */}
            <div className="flex items-start gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                0
              </div>
              <div>
                <span className="font-bold text-slate-800">08:30 • จุดเริ่มต้น</span>
                <p className="text-slate-500">{planResult?.startLocationName}</p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                กำลังคำนวณลำดับเส้นทางด้วย 2-opt TSP...
              </div>
            ) : planResult?.stops?.map((stop: any) => (
              <div
                key={stop.businessId}
                className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm text-xs hover:border-teal-500 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {stop.stopOrder}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">
                        {stop.businessName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {stop.businessType} • ต.{stop.subdistrict}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      stop.riskScore >= 75
                        ? "bg-red-100 text-red-700"
                        : stop.riskScore >= 55
                        ? "bg-orange-100 text-orange-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    Risk {stop.riskScore}
                  </span>
                </div>

                {/* Arrival & Time Window */}
                <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-teal-600" />
                    <span>
                      {stop.arrivalTime} - {stop.departureTime} น. ({stop.durationMinutes} นาที)
                    </span>
                  </div>
                  <span>+{stop.distanceFromPrevKm} กม.</span>
                </div>

                {/* Why This Stop */}
                <div className="rounded-lg bg-teal-50/70 p-2 text-[11px] text-teal-900 border border-teal-200/50 flex items-start gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <b>เหตุผลที่ระบบแนะนำ:</b> {stop.whyThisStop}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-1 flex gap-2">
                  <a
                    href={`/inspections/new?businessId=${stop.businessId}`}
                    className="flex-1 text-center py-1.5 bg-teal-600 text-white rounded-lg font-semibold text-[11px] hover:bg-teal-700"
                  >
                    เริ่มตรวจสถานที่นี้
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 font-semibold text-[11px] hover:bg-slate-50"
                  >
                    นำทาง
                  </a>
                </div>
              </div>
            ))}

            {/* Return to base */}
            <div className="flex items-start gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                ★
              </div>
              <div>
                <span className="font-bold text-slate-800">เดินทางกลับสำนักงาน</span>
                <p className="text-slate-500">{planResult?.startLocationName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

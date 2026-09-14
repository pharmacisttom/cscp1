"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Filter, RefreshCw, AlertCircle, Building2, MapPin } from "lucide-react";
import { MapMarkerItem } from "@/components/map/smart-map-view";

// Dynamically import map to prevent SSR window reference error
const SmartMapView = dynamic(() => import("@/components/map/smart-map-view"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-2" />
      <span className="text-xs font-semibold">กำลังโหลดแผนที่เฝ้าระวังอัจฉริยะ (Smart Map)...</span>
    </div>
  ),
});

export default function SmartMapPage() {
  const [markers, setMarkers] = useState<MapMarkerItem[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [subdistrictFilter, setSubdistrictFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const businessTypes = [
    "ALL",
    "คลินิก / สถานพยาบาล",
    "ร้านขายยา",
    "สถานที่ผลิตอาหาร",
    "สถานที่ผลิตน้ำดื่ม",
    "ร้านชำ / ร้านค้าชุมชน",
  ];

  const subdistricts = [
    "ALL",
    "ปลวกแดง",
    "ตาสิทธิ์",
    "ละหาร",
    "แม่น้ำคู้",
    "มาบยางพร",
    "หนองไร่",
  ];

  const riskLevels = ["ALL", "CRITICAL", "HIGH", "MODERATE", "LOW"];

  const fetchMarkers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (subdistrictFilter !== "ALL") params.set("subdistrict", subdistrictFilter);
      if (riskFilter !== "ALL") params.set("risk", riskFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/map/businesses?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setMarkers(json.data);
      }

      // Also load spatial clusters
      const survRes = await fetch("/api/surveillance/indicators");
      const survJson = await survRes.json();
      if (survJson.success) {
        setClusters(survJson.clusters || []);
      }
    } catch (e) {
      console.error("Fetch markers error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkers();
  }, [typeFilter, subdistrictFilter, riskFilter, statusFilter]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Top Filter Bar */}
      <div className="z-10 bg-white/95 border-b border-slate-200/80 px-4 py-2.5 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1">
              <Filter className="h-4 w-4 text-teal-600" />
              <span>ตัวกรองแผนที่:</span>
            </div>

            {/* Business Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {businessTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "ALL" ? "ทุกประเภทสถานประกอบการ" : t}
                </option>
              ))}
            </select>

            {/* Subdistrict Filter */}
            <select
              value={subdistrictFilter}
              onChange={(e) => setSubdistrictFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {subdistricts.map((s) => (
                <option key={s} value={s}>
                  {s === "ALL" ? "ทุกตำบล (อ.ปลวกแดง)" : `ต.${s}`}
                </option>
              ))}
            </select>

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {riskLevels.map((r) => (
                <option key={r} value={r}>
                  {r === "ALL" ? "ทุกระดับความเสี่ยง" : `ระดับ ${r}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">
              พบ{" "}
              <b className="text-teal-700 font-bold">{markers.length}</b>{" "}
              แห่งบนแผนที่
            </span>

            <button
              onClick={fetchMarkers}
              disabled={loading}
              className="flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              รีเฟรช
            </button>
          </div>
        </div>
      </div>

      {/* Map Control Center Component */}
      <div className="flex-1 relative w-full h-full min-h-[500px]" style={{ minHeight: "calc(100vh - 120px)" }}>
        <SmartMapView markers={markers} clusters={clusters} />
      </div>
    </div>
  );
}

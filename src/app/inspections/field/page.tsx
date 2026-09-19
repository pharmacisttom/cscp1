"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { DistrictModuleGate } from "@/components/auth/district-module-gate";
import {
  Smartphone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Navigation,
  RefreshCw,
  Crosshair,
  ShieldCheck,
} from "lucide-react";

export default function FieldModePage() {
  const { moduleAccess } = useAuth();
  const [currentGps, setCurrentGps] = useState<{
    lat: number;
    lng: number;
    accuracy: number | null;
  } | null>(null);

  const [gpsError, setGpsError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [verifying, setVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Watch GPS Position
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGpsError("อุปกรณ์ไม่รองรับระบบระบุตำแหน่ง GPS");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentGps({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Number(pos.coords.accuracy.toFixed(1)),
        });
        setGpsError(null);
      },
      (err) => {
        setGpsError(`ไม่สามารถดึงตำแหน่งพิกัด: ${err.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Fetch candidate businesses
  useEffect(() => {
    async function loadBusinesses() {
      try {
        const res = await fetch("/api/map/businesses?hasGps=false");
        const json = await res.json();
        if (json.success) {
          setBusinesses(json.data);
          if (json.data.length > 0) {
            setSelectedBusinessId(json.data[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadBusinesses();
  }, []);

  const handleVerifyLocation = async () => {
    if (!currentGps || !selectedBusinessId) return;

    setVerifying(true);
    setVerifySuccess(null);

    try {
      const res = await fetch("/api/locations/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: selectedBusinessId,
          latitude: currentGps.lat,
          longitude: currentGps.lng,
          accuracy: currentGps.accuracy,
          officerId: "OFFICER_FIELD",
        }),
      });

      const json = await res.json();
      if (json.success) {
        setVerifySuccess("ยืนยันพิกัด GPS ณ หน้างานสำเร็จเรียบร้อย!");
        // Remove from missing list
        setBusinesses((prev) => prev.filter((b) => b.id !== selectedBusinessId));
      } else {
        alert(json.error || "เกิดข้อผิดพลาดในการบันทึกพิกัด");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setVerifying(false);
    }
  };

  if (!moduleAccess.inspections) return <DistrictModuleGate module="inspections"><></></DistrictModuleGate>;

  return (
    <div className="flex-1 max-w-lg mx-auto w-full p-4 space-y-4">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-700 p-5 text-white shadow-lg">
        <div className="flex items-center gap-2 font-bold text-base">
          <Smartphone className="h-5 w-5" />
          <span>CSCP Field Mode & GPS Verification</span>
        </div>
        <p className="text-xs text-teal-100 mt-1">
          ระบบยืนยันพิกัดและบันทึกตรวจประเมินหน้างานสำหรับพนักงานเจ้าหน้าที่
        </p>
      </div>

      {/* GPS Current Position Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Crosshair className="h-4 w-4 text-teal-600" />
            ตำแหน่ง GPS ปัจจุบันของท่าน
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live GPS
          </span>
        </div>

        {gpsError ? (
          <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
            {gpsError} (กรุณากดอนุญาตการเข้าถึง Location บนเบราว์เซอร์)
          </div>
        ) : currentGps ? (
          <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 block">ละติจูด</span>
              <b className="text-slate-800 font-mono text-sm">{currentGps.lat}</b>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">ลองจิจูด</span>
              <b className="text-slate-800 font-mono text-sm">{currentGps.lng}</b>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">ความแม่นยำ</span>
              <b className="text-teal-700 font-mono text-sm">
                ±{currentGps.accuracy} ม.
              </b>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            กำลังตรวจจับสัญญาณดาวเทียม GPS...
          </div>
        )}
      </div>

      {/* Target Business Selection & Verification */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <span className="text-xs font-bold text-slate-800 block">
          เลือกสถานประกอบการที่ต้องการยืนยันพิกัดหน้างาน
        </span>

        {(() => {
          const selectedBusinessName = businesses.find(b => b.id === selectedBusinessId)?.name || "เลือกสถานประกอบการ...";
          const filteredBusinesses = businesses.filter((b) =>
            `${b.name} ${b.type} ${b.subdistrict}`.toLowerCase().includes(searchQuery.toLowerCase())
          );

          return (
            <div className="relative">
              <input
                type="text"
                placeholder="พิมพ์ชื่อสถานประกอบการเพื่อค้นหา..."
                value={dropdownOpen ? searchQuery : selectedBusinessName}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => {
                  setSearchQuery("");
                  setDropdownOpen(true);
                }}
                onBlur={() => {
                  setTimeout(() => setDropdownOpen(false), 200);
                }}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 font-medium focus:border-teal-500 focus:outline-none"
              />
              {dropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredBusinesses.length > 0 ? (
                    filteredBusinesses.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBusinessId(b.id);
                          setDropdownOpen(false);
                        }}
                        className="p-4 text-sm hover:bg-teal-50 cursor-pointer border-b border-slate-100 last:border-0"
                      >
                        <div className="font-bold text-slate-800">{b.name}</div>
                        <div className="text-xs text-slate-500">{b.type} • ต.{b.subdistrict}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-slate-500 text-center">ไม่พบสถานประกอบการ</div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {verifySuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>{verifySuccess}</span>
          </div>
        )}

        <button
          onClick={handleVerifyLocation}
          disabled={verifying || !currentGps}
          className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <ShieldCheck className="h-5 w-5" />
          {verifying ? "กำลังบันทึกพิกัด..." : "ยืนยันพิกัดสถานประกอบการนี้ (Verify GPS)"}
        </button>
      </div>

      {/* Dynamic Assessment Shortcut */}
      {selectedBusinessId && (
        <a
          href={`/inspections/new?businessId=${selectedBusinessId}`}
          className="w-full py-4 border-2 border-teal-600 text-teal-700 bg-teal-50/50 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-teal-100/50"
        >
          <Camera className="h-5 w-5" />
          เปิดแบบตรวจประเมินหน้างาน & ถ่ายภาพ
        </a>
      )}
    </div>
  );
}

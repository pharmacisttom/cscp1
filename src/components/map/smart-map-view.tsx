"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Layers,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  X,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
  Navigation,
  FileText,
  MapPin,
  Eye,
} from "lucide-react";
import { MAP_LAYERS, RISK_PALETTE } from "@/lib/maps/layers";
import { getActiveTileConfig } from "@/lib/maps/map-provider";

export interface MapMarkerItem {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  subdistrict: string;
  type: string;
  typeCode: string;
  riskScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "COMPLAINT" | "UNKNOWN";
  status: string;
  licenseNo: string;
  isNearExpiry: boolean;
  hasOpenComplaint: boolean;
  verifiedGps: boolean;
  lastInspection: string | null;
  nextInspection: string | null;
}

interface SmartMapViewProps {
  markers: MapMarkerItem[];
  selectedMarkerId?: string | null;
  onSelectMarker?: (id: string) => void;
  clusters?: any[];
  routePath?: { lat: number; lng: number }[];
  stops?: any[];
}

export default function SmartMapView({
  markers,
  selectedMarkerId,
  onSelectMarker,
  clusters = [],
  routePath = [],
  stops = [],
}: SmartMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const clusterGroupRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const provinceLayerRef = useRef<any>(null);
  const districtLayerRef = useRef<any>(null);
  const subdistrictLayerRef = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const [boundaries, setBoundaries] = useState<{
    province: any;
    districts: any;
    subdistricts: any;
  }>({
    province: null,
    districts: null,
    subdistricts: null,
  });

  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    all_businesses: true,
    risk_level: true,
    hotspots: true,
    province_boundary: true,
    district_boundary: true,
    subdistrict_boundary: true,
    inspection_route: true,
  });

  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load Administrative Boundaries (Province, Districts, Subdistricts)
  useEffect(() => {
    async function loadBoundaries() {
      try {
        const res = await fetch("/api/map/boundaries?level=all");
        const json = await res.json();
        if (json.success) {
          setBoundaries(json.data);
        }
      } catch (e) {
        console.error("Load boundaries error:", e);
      }
    }
    loadBoundaries();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      try {
        const leafletModule = await import("leaflet");
        const L = (leafletModule as any).default || leafletModule;

        if (!mapContainerRef.current || !isMounted) return;

        // Pluak Daeng Hospital coordinates center (CSCP Headquarters Base)
        const map = L.map(mapContainerRef.current, {
          center: [12.969713, 101.219305],
          zoom: 13,
          zoomControl: false,
        });

        // Add standard zoom control at top right
        L.control.zoom({ position: "topright" }).addTo(map);

        // Primary: Longdo Map API (Thailand's leading mapping provider)
        const tileConfig = getActiveTileConfig();
        L.tileLayer(tileConfig.url, {
          attribution: tileConfig.attribution,
          maxZoom: tileConfig.maxZoom,
          subdomains: tileConfig.subdomains || "abc",
        }).addTo(map);

        provinceLayerRef.current = L.layerGroup().addTo(map);
        districtLayerRef.current = L.layerGroup().addTo(map);
        subdistrictLayerRef.current = L.layerGroup().addTo(map);
        layerGroupRef.current = L.layerGroup().addTo(map);
        clusterGroupRef.current = L.layerGroup().addTo(map);
        routeLayerRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

        // Force Leaflet to recalculate container dimensions
        setTimeout(() => {
          if (isMounted && map) map.invalidateSize();
        }, 200);
        setTimeout(() => {
          if (isMounted && map) map.invalidateSize();
        }, 600);

        if (isMounted) setMapReady(true);
      } catch (err) {
        console.error("Leaflet init error:", err);
      }
    }

    initMap();

    const handleWindowResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener("resize", handleWindowResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleWindowResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Layers when props or mapReady change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !layerGroupRef.current) return;

    let isMounted = true;

    import("leaflet").then((leafletModule) => {
      if (!isMounted) return;
      const L = (leafletModule as any).default || leafletModule;
      const map = mapInstanceRef.current;
      const markerGroup = layerGroupRef.current;
      const clusterGroup = clusterGroupRef.current;
      const routeLayer = routeLayerRef.current;
      const provinceLayer = provinceLayerRef.current;
      const districtLayer = districtLayerRef.current;
      const subdistrictLayer = subdistrictLayerRef.current;

      markerGroup.clearLayers();
      clusterGroup.clearLayers();
      routeLayer.clearLayers();
      if (provinceLayer) provinceLayer.clearLayers();
      if (districtLayer) districtLayer.clearLayers();
      if (subdistrictLayer) subdistrictLayer.clearLayers();

      // 1. Render Rayong Province Boundary (จังหวัดระยอง)
      if (activeLayers.province_boundary && boundaries.province && provinceLayer) {
        L.geoJSON(boundaries.province, {
          style: {
            color: "#1e3a8a",
            weight: 3.5,
            opacity: 0.9,
            fillColor: "#1e3a8a",
            fillOpacity: 0.02,
            dashArray: "8, 6",
          },
          onEachFeature: (feature: any, layer: any) => {
            layer.bindTooltip("<b>ขอบเขตจังหวัดระยอง (Rayong Province)</b>", {
              sticky: true,
              direction: "top",
            });
          },
        }).addTo(provinceLayer);
      }

      // 2. Render District Boundaries in Rayong (8 อำเภอ จ.ระยอง)
      if (activeLayers.district_boundary && boundaries.districts && districtLayer) {
        L.geoJSON(boundaries.districts, {
          style: (feature: any) => {
            const isPluakDaeng = feature?.properties?.name?.includes("ปลวกแดง");
            return {
              color: isPluakDaeng ? "#0d9488" : "#4f46e5",
              weight: isPluakDaeng ? 3 : 2,
              opacity: 0.85,
              fillColor: isPluakDaeng ? "#0d9488" : "#4f46e5",
              fillOpacity: isPluakDaeng ? 0.06 : 0.02,
              dashArray: "5, 5",
            };
          },
          onEachFeature: (feature: any, layer: any) => {
            const name = feature.properties?.name || "อำเภอ";
            layer.bindTooltip(`<b>${name}</b><br/>จังหวัดระยอง`, {
              sticky: true,
              direction: "top",
            });
          },
        }).addTo(districtLayer);
      }

      // 3. Render Subdistrict Boundaries (6 ตำบล อ.ปลวกแดง)
      if (activeLayers.subdistrict_boundary && boundaries.subdistricts && subdistrictLayer) {
        L.geoJSON(boundaries.subdistricts, {
          style: (feature: any) => ({
            color: feature?.properties?.color || "#0d9488",
            weight: 2,
            opacity: 0.9,
            fillColor: feature?.properties?.color || "#0d9488",
            fillOpacity: 0.12,
          }),
          onEachFeature: (feature: any, layer: any) => {
            const name = feature.properties?.name || "ตำบล";
            layer.bindTooltip(`<b>${name}</b><br/>อ.ปลวกแดง จ.ระยอง`, {
              sticky: true,
              direction: "top",
            });
          },
        }).addTo(subdistrictLayer);
      }

      const validLatLngs: [number, number][] = [];

      // 4. Render CSCP Center Base: โรงพยาบาลปลวกแดง (Main Inspection Base)
      const hqLat = 12.969713;
      const hqLng = 101.219305;
      validLatLngs.push([hqLat, hqLng]);

      const hqHtml = `
        <div style="
          background: linear-gradient(135deg, #0d9488, #0f766e);
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
          cursor: pointer;
        " class="hq-pulse">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 6v12M6 12h12"/>
          </svg>
        </div>
      `;
      const hqIcon = L.divIcon({
        html: hqHtml,
        className: "custom-div-icon",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      L.marker([hqLat, hqLng], { icon: hqIcon, zIndexOffset: 1000 })
        .bindTooltip(
          `<strong>ศูนย์หลัก CSCP: โรงพยาบาลปลวกแดง</strong><br/>จุดหลักตั้งต้นและสิ้นสุดการออกตรวจ จ.ระยอง<br/><span style="color:#0d9488;font-weight:bold;">HQ Base: 12.969713, 101.219305</span>`,
          { direction: "top", offset: [0, -18] }
        )
        .addTo(markerGroup);

      // 5. Render Markers with color-blind accessible icons
      if (activeLayers.all_businesses) {
        markers.forEach((m) => {
          if (!m.lat || !m.lng) return;
          validLatLngs.push([m.lat, m.lng]);

          // Determine color & icon
          let color = "#10b981";
          let label = "L";
          if (m.hasOpenComplaint && activeLayers.complaints) {
            color = "#8b5cf6";
            label = "!";
          } else if (m.riskLevel === "CRITICAL") {
            color = "#ef4444";
            label = "C";
          } else if (m.riskLevel === "HIGH") {
            color = "#f97316";
            label = "H";
          } else if (m.riskLevel === "MODERATE") {
            color = "#f59e0b";
            label = "M";
          }

          // HTML Custom Marker
          const customHtml = `
            <div style="
              background-color: ${color};
              width: 28px;
              height: 28px;
              border-radius: 9999px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 800;
              font-size: 11px;
              border: 2px solid white;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.35);
              cursor: pointer;
            " class="${m.riskLevel === "CRITICAL" ? "critical-pulse" : ""}">
              ${label}
            </div>
          `;

          const customIcon = L.divIcon({
            html: customHtml,
            className: "custom-div-icon",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.marker([m.lat, m.lng], { icon: customIcon });

          marker.on("click", () => {
            handleMarkerClick(m.id);
          });

          marker.bindTooltip(
            `<strong>${m.name}</strong><br/><span style="color:${color}">${m.type} • ความเสี่ยง: ${m.riskScore}</span>`,
            { direction: "top", offset: [0, -14] }
          );

          marker.addTo(markerGroup);
        });
      }

      // 2. Render Hotspots / Clusters
      if (activeLayers.hotspots && clusters.length > 0) {
        clusters.forEach((c) => {
          const circle = L.circle([c.centroidLat, c.centroidLng], {
            radius: c.radiusMeters || 600,
            color: "#dc2626",
            fillColor: "#ef4444",
            fillOpacity: 0.18,
            weight: 2,
            dashArray: "4, 6",
          });
          circle.bindTooltip(
            `<strong>จุดเสี่ยงหนาแน่น (${c.clusterId})</strong><br/>สถานประกอบการในคลัสเตอร์: ${c.businessCount} แห่ง<br/>ความเสี่ยงเฉลี่ย: ${c.averageRisk}`,
            { direction: "top" }
          );
          circle.addTo(clusterGroup);
        });
      }

      // 3. Render Inspection Route
      if (activeLayers.inspection_route && routePath.length > 1) {
        const latLngs: [number, number][] = routePath.map((p) => [p.lat, p.lng]);
        const polyline = L.polyline(latLngs, {
          color: "#0284c7",
          weight: 4,
          opacity: 0.85,
          dashArray: "8, 6",
        });
        polyline.addTo(routeLayer);
      }

      // Render Stop Numbers
      if (activeLayers.inspection_route && stops.length > 0) {
        stops.forEach((s) => {
          const stopHtml = `
            <div style="
              background-color: #0284c7;
              width: 24px;
              height: 24px;
              border-radius: 9999px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 800;
              font-size: 11px;
              border: 2px solid white;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            ">
              ${s.stopOrder}
            </div>
          `;
          const stopIcon = L.divIcon({
            html: stopHtml,
            className: "stop-div-icon",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          L.marker([s.latitude, s.longitude], { icon: stopIcon })
            .bindTooltip(`จุดตรวจที่ ${s.stopOrder}: ${s.businessName}<br/>เวลา: ${s.arrivalTime} น.`)
            .addTo(routeLayer);
        });
      }

      // Fit bounds if markers exist and no manual route is active
      if (validLatLngs.length > 0 && routePath.length === 0) {
        const bounds = L.latLngBounds(validLatLngs);
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [mapReady, markers, activeLayers, clusters, routePath, stops, boundaries]);

  const handleMarkerClick = async (businessId: string) => {
    setIsDrawerOpen(true);
    setDetailLoading(true);
    if (onSelectMarker) onSelectMarker(businessId);

    try {
      const res = await fetch(`/api/map/business/${businessId}`);
      const json = await res.json();
      if (json.success) {
        setSelectedBusiness(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleLayer = (layerId: string) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  return (
    <div
      className="relative w-full h-full flex-1 flex overflow-hidden min-h-[450px]"
      style={{ minHeight: "450px", height: "100%", width: "100%" }}
    >
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[450px] z-0"
        style={{ minHeight: "450px", height: "100%", width: "100%" }}
      />

      {/* Layer Toggle Button & Panel */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-lg border border-slate-200/80 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <Layers className="h-4 w-4 text-teal-600" />
          <span>ชั้นข้อมูลแผนที่ (12 Layers)</span>
          <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-800">
            {Object.values(activeLayers).filter(Boolean).length}
          </span>
        </button>

        {showLayerMenu && (
          <div className="mt-2 w-72 max-h-[75vh] overflow-y-auto rounded-2xl bg-white/95 p-3.5 shadow-2xl border border-slate-200 backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <span className="text-xs font-bold text-slate-800">เลือกเปิด/ปิดชั้นข้อมูล</span>
              <button
                onClick={() => setShowLayerMenu(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              {MAP_LAYERS.map((layer) => (
                <label
                  key={layer.id}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: layer.color }}
                    />
                    <span className="font-medium text-slate-700">{layer.name}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!activeLayers[layer.id]}
                    onChange={() => toggleLayer(layer.id)}
                    className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                  />
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-6 left-4 z-20 hidden md:block">
        <div className="rounded-2xl bg-white/90 p-3 shadow-lg border border-slate-200/80 backdrop-blur-md">
          <div className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-teal-600" />
            <span>สัญลักษณ์ระดับความเสี่ยง (Accessible Symbology)</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-medium text-slate-600">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-bold">
                L
              </span>
              <span>เสี่ยงต่ำ</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] font-bold">
                M
              </span>
              <span>ปานกลาง</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-orange-500 text-white flex items-center justify-center text-[8px] font-bold">
                H
              </span>
              <span>สูง</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-red-500 text-white flex items-center justify-center text-[8px] font-bold">
                C
              </span>
              <span>วิกฤต</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-purple-500 text-white flex items-center justify-center text-[8px] font-bold">
                !
              </span>
              <span>ร้องเรียน</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Sliding Drawer */}
      {isDrawerOpen && (
        <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white shadow-2xl z-30 border-l border-slate-200 flex flex-col transition-all">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">ข้อมูลสถานประกอบการ</span>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {detailLoading ? (
              <div className="py-20 text-center text-xs text-slate-500">
                กำลังโหลดข้อมูลสถานประกอบการ...
              </div>
            ) : selectedBusiness ? (
              <>
                {/* Header Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 border border-teal-200 mb-1">
                        {selectedBusiness.businessType}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {selectedBusiness.name}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-500">Risk Score</div>
                      <div
                        className={`text-xl font-extrabold ${
                          selectedBusiness.riskScore >= 75
                            ? "text-red-600"
                            : selectedBusiness.riskScore >= 55
                            ? "text-orange-600"
                            : selectedBusiness.riskScore >= 35
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {selectedBusiness.riskScore}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <p>
                      <b>ที่อยู่:</b> {selectedBusiness.location?.address || "-"} ต.
                      {selectedBusiness.location?.subdistrict} อ.
                      {selectedBusiness.location?.district}
                    </p>
                    <p>
                      <b>ใบอนุญาต:</b>{" "}
                      {selectedBusiness.licenses[0]?.licenseNo || "ไม่มีข้อมูล"}
                    </p>
                    <p>
                      <b>ผู้รับอนุญาต/ผู้ดำเนินการ:</b>{" "}
                      {selectedBusiness.licenses[0]?.licenseeName ||
                        selectedBusiness.licenses[0]?.operatorName ||
                        "-"}
                    </p>
                    <p>
                      <b>เวลาเปิดบริการ:</b> {selectedBusiness.openingHours || "-"}
                    </p>
                    <p>
                      <b>เบอร์โทรศัพท์:</b> {selectedBusiness.phone || "-"}
                    </p>
                  </div>
                </div>

                {/* Explainable Risk Engine Breakdown */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-teal-600" />
                      เหตุผลความเสี่ยง (Explainable Risk)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      GEOEPI-RISK-1.0
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {selectedBusiness.riskBreakdown &&
                    selectedBusiness.riskBreakdown.length > 0 ? (
                      selectedBusiness.riskBreakdown.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg bg-white p-2 border border-slate-200/60"
                        >
                          <span className="text-slate-700">{item.reason}</span>
                          <span className="font-bold text-amber-700">
                            +{item.weight}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-xs">
                        ความเสี่ยงพื้นฐานตามประเภทสถานประกอบการ
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <a
                    href={`/inspections/new?businessId=${selectedBusiness.id}`}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2.5 text-xs font-bold text-white shadow hover:bg-teal-700"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    บันทึกผลตรวจ
                  </a>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedBusiness.location?.latitude},${selectedBusiness.location?.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Navigation className="h-3.5 w-3.5 text-teal-600" />
                    นำทาง GPS
                  </a>
                </div>

                {/* History & PDF/Image Attachments */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">
                    ประวัติการตรวจและข้อบกพร่องล่าสุด
                  </h4>
                  {selectedBusiness.inspections?.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedBusiness.inspections.map((ins: any) => (
                        <div
                          key={ins.id}
                          className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs space-y-1"
                        >
                          <div className="flex justify-between font-semibold text-slate-800">
                            <span>วันที่: {ins.date}</span>
                            <span
                              className={
                                ins.result === "PASSED"
                                  ? "text-emerald-600 font-bold"
                                  : "text-red-600 font-bold"
                              }
                            >
                              {ins.result === "PASSED" ? "ผ่านเกณฑ์" : "ไม่ผ่านเกณฑ์"} (
                              {ins.score}/100)
                            </span>
                          </div>
                          {ins.problemFound && (
                            <p className="text-slate-600">
                              <b>ข้อบกพร่อง:</b> {ins.problemFound}
                            </p>
                          )}
                          {ins.recommendation && (
                            <p className="text-slate-500 text-[11px]">
                              <b>คำสั่งแก้ไข:</b> {ins.recommendation}
                            </p>
                          )}

                          {/* Attached PDFs & Evidence Photos */}
                          {ins.attachments && ins.attachments.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-200/60 space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-500 block">
                                เอกสารและภาพถ่ายผลตรวจ ({ins.attachments.length} ไฟล์):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {ins.attachments.map((att: any) => (
                                  <a
                                    key={att.id}
                                    href={att.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-700 hover:border-teal-500 hover:text-teal-700 shadow-xs"
                                  >
                                    {att.fileType === "PDF" ? (
                                      <span className="text-rose-600 font-bold text-[10px]">
                                        PDF
                                      </span>
                                    ) : (
                                      <span className="text-teal-600 font-bold text-[10px]">
                                        IMG
                                      </span>
                                    )}
                                    <span className="truncate max-w-[120px]">
                                      {att.fileName || "ดูเอกสาร"}
                                    </span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      ยังไม่มีประวัติการตรวจในระบบ
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

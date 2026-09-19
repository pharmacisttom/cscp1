"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { DistrictModuleGate } from "@/components/auth/district-module-gate";
import {
  ClipboardCheck,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  ShieldAlert,
  Building2,
  Plus,
} from "lucide-react";

export default function InspectionsHistoryPage() {
  const { moduleAccess } = useAuth();
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("ALL");

  useEffect(() => {
    async function loadInspections() {
      try {
        const res = await fetch("/api/inspections");
        const json = await res.json();
        if (json.success) {
          setInspections(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadInspections();
  }, []);

  const filtered = inspections.filter((ins) => {
    const matchSearch =
      !search ||
      ins.business?.name?.toLowerCase().includes(search.toLowerCase()) ||
      ins.inspectorName?.toLowerCase().includes(search.toLowerCase()) ||
      ins.problemFound?.toLowerCase().includes(search.toLowerCase());

    const matchResult = resultFilter === "ALL" || ins.result === resultFilter;

    return matchSearch && matchResult;
  });

  if (!moduleAccess.inspections) return <DistrictModuleGate module="inspections"><></></DistrictModuleGate>;

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              ระบบบันทึกและคลังผลการตรวจประเมิน
            </h1>
            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800 border border-teal-200">
              Inspection Archive & Documents
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            เรียกดูประวัติการตรวจประเมิน เอกสารรายงาน PDF รูปภาพผลตรวจ และลำดับความเสี่ยง
          </p>
        </div>

        <Link
          href="/map"
          className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          เลือกสถานประกอบการเพื่อตรวจใหม่
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสถานประกอบการ, ผู้ตรวจ, ข้อบกพร่อง..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">ผลการตรวจ:</span>
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">ทั้งหมด (All Results)</option>
            <option value="PASSED">ผ่านเกณฑ์ (Passed)</option>
            <option value="FAILED">ไม่ผ่านเกณฑ์ (Failed)</option>
          </select>
        </div>
      </div>

      {/* Inspections List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          กำลังโหลดประวัติการตรวจประเมิน...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-2">
          <ClipboardCheck className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">ยังไม่พบประวัติการตรวจตามเงื่อนไข</h3>
          <p className="text-xs text-slate-400">
            ท่านสามารถเปิดแผนที่ Smart Map เพื่อเลือกสถานประกอบการและเริ่มบันทึกผลตรวจพร้อมแนบไฟล์ PDF/รูปภาพ
          </p>
          <div className="pt-2">
            <Link
              href="/map"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700"
            >
              ไปที่ Smart Map
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ins) => (
            <div
              key={ins.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 border border-teal-200">
                      {ins.business?.businessType?.name || "สถานประกอบการ"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ตรวจเมื่อ: {new Date(ins.inspectionDate).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {ins.business?.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                      ins.result === "PASSED"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-red-100 text-red-800 border border-red-200"
                    }`}
                  >
                    {ins.result === "PASSED" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    {ins.result === "PASSED" ? "ผ่านเกณฑ์มาตรฐาน" : "ไม่ผ่านเกณฑ์"} (
                    {ins.score}/100)
                  </span>

                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                      ins.business?.riskLevel === "CRITICAL"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : ins.business?.riskLevel === "HIGH"
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : ins.business?.riskLevel === "MODERATE"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    ความเสี่ยง: {ins.business?.riskLevel} ({ins.business?.riskScore})
                  </span>
                </div>
              </div>

              {/* Inspector & Notes */}
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <b>ผู้ตรวจประเมิน:</b> {ins.inspectorName}
                </p>
                {ins.problemFound && (
                  <p className="text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100">
                    <b>ข้อบกพร่อง:</b> {ins.problemFound}
                  </p>
                )}
                {ins.recommendation && (
                  <p className="text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <b>คำสั่งแก้ไข:</b> {ins.recommendation}
                  </p>
                )}
                {ins.nextFollowupDate && (
                  <p className="text-orange-700 font-semibold">
                    <b>กำหนดติดตามผล:</b>{" "}
                    {new Date(ins.nextFollowupDate).toLocaleDateString("th-TH")}
                  </p>
                )}
              </div>

              {/* Attached PDFs and Photo Evidence Gallery */}
              {ins.attachments && ins.attachments.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 block mb-2">
                    เอกสาร PDF และหลักฐานรูปภาพผลตรวจ ({ins.attachments.length} ไฟล์):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {ins.attachments.map((att: any) => (
                      <a
                        key={att.id}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:bg-white hover:border-teal-500 hover:shadow-sm transition-all"
                      >
                        {att.fileType === "PDF" ? (
                          <div className="flex items-center gap-1 text-rose-600 font-bold">
                            <FileText className="h-4 w-4" />
                            <span>PDF รายงาน</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <img
                              src={att.fileUrl}
                              alt={att.fileName}
                              className="h-7 w-7 rounded-md object-cover border border-slate-200"
                            />
                            <span className="text-teal-700 font-semibold">รูปภาพ</span>
                          </div>
                        )}
                        <span className="text-slate-700 max-w-[140px] truncate">
                          {att.fileName || "ดูเอกสาร"}
                        </span>
                        <Eye className="h-3.5 w-3.5 text-slate-400 ml-1" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

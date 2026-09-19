"use client";

import { useState } from "react";
import Link from "next/link";

export function IssuesTabs({ issues }: { issues: any[] }) {
  // Extract unique business types
  const types = Array.from(new Set(issues.map(i => i.business?.businessType?.name || "ไม่ระบุประเภท"))).sort();
  
  const [activeTab, setActiveTab] = useState<string>("ทั้งหมด");

  const filteredIssues = activeTab === "ทั้งหมด" 
    ? issues 
    : issues.filter(i => (i.business?.businessType?.name || "ไม่ระบุประเภท") === activeTab);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h3 className="font-bold text-sm text-slate-900">
          รายการสถานประกอบการที่ต้องตรวจสอบความสมบูรณ์ของข้อมูล ({issues.length} รายการ)
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-4 pb-2 border-b border-slate-100 scrollbar-hide">
        <button
          onClick={() => setActiveTab("ทั้งหมด")}
          className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-full transition-colors ${
            activeTab === "ทั้งหมด"
              ? "bg-teal-600 text-white shadow-sm"
              : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          ทั้งหมด ({issues.length})
        </button>
        {types.map(type => {
          const count = issues.filter(i => (i.business?.businessType?.name || "ไม่ระบุประเภท") === type).length;
          return (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-full transition-colors ${
                activeTab === type
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {type} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
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
            {filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50/70">
                  <td className="p-3 font-bold text-slate-900">
                    {issue.business?.name || "-"}
                  </td>
                  <td className="p-3">{issue.business?.businessType?.name || "-"}</td>
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
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">
                  ไม่พบรายการในหมวดหมู่นี้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

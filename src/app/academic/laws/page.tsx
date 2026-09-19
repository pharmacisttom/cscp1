import React from "react";
import Link from "next/link";
import { Search, Scale, FileText, ChevronRight, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "คลังกฎหมาย คบส. - ศูนย์วิชาการ",
};

export default async function LawsIndexPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  const { category, q } = await searchParams;

  const categories = [
    { id: "ALL", label: "ทั้งหมด", icon: <Scale className="w-4 h-4" /> },
    { id: "DRUG", label: "ยา", icon: <FileText className="w-4 h-4" /> },
    { id: "FOOD", label: "อาหาร", icon: <FileText className="w-4 h-4" /> },
    { id: "COSMETIC", label: "เครื่องสำอาง", icon: <FileText className="w-4 h-4" /> },
    { id: "MEDICAL_DEVICE", label: "เครื่องมือแพทย์", icon: <FileText className="w-4 h-4" /> },
    { id: "HERB", label: "สมุนไพร", icon: <FileText className="w-4 h-4" /> },
    { id: "HAZARDOUS", label: "วัตถุอันตราย", icon: <FileText className="w-4 h-4" /> },
    { id: "NARCOTIC", label: "ยาเสพติด", icon: <FileText className="w-4 h-4" /> },
    { id: "CLINIC", label: "สถานพยาบาล", icon: <FileText className="w-4 h-4" /> },
    { id: "SPA", label: "สถานประกอบการเพื่อสุขภาพ", icon: <FileText className="w-4 h-4" /> },
    { id: "PROFESSIONAL", label: "วิชาชีพ", icon: <FileText className="w-4 h-4" /> },
    { id: "SUPPORTING", label: "กฎหมายสนับสนุน", icon: <FileText className="w-4 h-4" /> },
  ];

  const whereClause: any = {};
  if (category && category !== "ALL") {
    whereClause.category = category;
  }
  if (q) {
    whereClause.lawNameTh = { contains: q };
  }

  const laws = await prisma.knowledgeLaw.findMany({
    where: whereClause,
    orderBy: [{ year: "desc" }, { lawNameTh: "asc" }],
    include: {
      _count: {
        select: { sections: true, cases: true }
      }
    }
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Scale className="w-8 h-8 text-indigo-600" />
            คลังกฎหมาย คบส.
          </h1>
          <p className="text-slate-500 mt-2">
            สืบค้นพระราชบัญญัติ, กฎกระทรวง, ประกาศ และระเบียบที่เกี่ยวข้องกับงานคุ้มครองผู้บริโภคด้านสาธารณสุข
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
        <form className="relative" method="GET">
          <input type="hidden" name="category" value={category || "ALL"} />
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="ค้นหาชื่อกฎหมาย..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          <button type="submit" className="hidden">Search</button>
        </form>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isActive = (category || "ALL") === cat.id;
            return (
              <Link
                key={cat.id}
                href={`/academic/laws?category=${cat.id}${q ? `&q=${q}` : ""}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-indigo-100 text-indigo-700 border-indigo-200 border"
                    : "bg-slate-50 text-slate-600 border-slate-200 border hover:bg-slate-100"
                }`}
              >
                {cat.icon}
                {cat.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Laws List */}
      {laws.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">ไม่พบข้อมูลกฎหมาย</h3>
          <p className="text-slate-500">
            ยังไม่มีการเพิ่มข้อมูลกฎหมายในหมวดหมู่นี้ หรือการค้นหาไม่ตรงกับข้อมูลที่มีอยู่
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {laws.map((law) => (
            <Link href={`/academic/laws/${law.id}`} key={law.id}>
              <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow hover:border-indigo-300 group flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                      {law.category}
                    </span>
                    <span className="text-slate-400 text-xs">{law.lawCode}</span>
                  </div>
                  <LawStatusBadge status={law.status} />
                </div>
                
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1">
                  {law.lawNameTh}
                </h3>
                {law.lawNameEn && (
                  <p className="text-xs text-slate-500 mb-3">{law.lawNameEn}</p>
                )}

                <div className="mt-auto pt-4 flex items-center gap-4 text-xs font-semibold text-slate-500 border-t border-slate-50">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {law._count.sections} มาตราสำคัญ
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {law._count.cases} กรณีศึกษา
                  </span>
                  
                  <span className="ml-auto flex items-center text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    ดูรายละเอียด <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function LawStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "CURRENT":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3" />
          บังคับใช้ปัจจุบัน
        </span>
      );
    case "REPEALED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3" />
          ยกเลิกแล้ว
        </span>
      );
    case "VERIFY":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
          <HelpCircle className="w-3 h-3" />
          รอตรวจสอบ
        </span>
      );
    case "UPDATED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
          <FileText className="w-3 h-3" />
          ฉบับปรับปรุง
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
          {status}
        </span>
      );
  }
}

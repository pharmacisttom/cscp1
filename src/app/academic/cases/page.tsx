import React from "react";
import Link from "next/link";
import { BookOpen, AlertTriangle, ShieldCheck, HelpCircle, ArrowRight, Activity, Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "กรณีศึกษา (Case-Based Learning) - ศูนย์วิชาการ",
};

export default async function CasesIndexPage() {
  const cases = await prisma.knowledgeCase.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      knowledgeLaw: true
    }
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-rose-500" />
            กรณีศึกษาที่พบบ่อย (Case Studies)
          </h1>
          <p className="text-slate-500 mt-2">
            เรียนรู้จากการปฏิบัติงานจริง 15 กรณีศึกษา พร้อมแนวทางจัดการ ความเสี่ยง และข้อกฎหมายที่เกี่ยวข้อง
          </p>
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">ไม่พบข้อมูลกรณีศึกษา</h3>
          <p className="text-slate-500">
            ระบบกำลังเตรียมข้อมูลกรณีศึกษา (Phase 2)
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c) => (
            <Link href={`/academic/cases/${c.id}`} key={c.id}>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all hover:border-rose-300 group flex flex-col h-full relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${getRiskColor(c.riskLevel)}`} />
                
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getRiskBadgeStyle(c.riskLevel)}`}>
                    {c.riskLevel} RISK
                  </span>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {c.category}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-rose-600 transition-colors line-clamp-2">
                  {c.title}
                </h3>
                
                <p className="text-sm text-slate-500 line-clamp-3 mb-6">
                  {c.scenario}
                </p>

                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-500">
                    {c.knowledgeLaw ? c.knowledgeLaw.lawCode : "ไม่มีข้อมูลกฎหมายอ้างอิง"}
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function getRiskColor(level: string) {
  switch (level) {
    case "CRITICAL": return "bg-rose-600";
    case "HIGH": return "bg-orange-500";
    case "MEDIUM": return "bg-amber-400";
    case "LOW": return "bg-emerald-500";
    default: return "bg-slate-400";
  }
}

function getRiskBadgeStyle(level: string) {
  switch (level) {
    case "CRITICAL": return "bg-rose-100 text-rose-700 border-rose-200";
    case "HIGH": return "bg-orange-100 text-orange-700 border-orange-200";
    case "MEDIUM": return "bg-amber-100 text-amber-700 border-amber-200";
    case "LOW": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, ExternalLink, Scale, ShieldCheck, AlertTriangle, HelpCircle, FileText, Calendar, Landmark, List, BookOpen } from "lucide-react";

export default async function LawDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  const law = await prisma.knowledgeLaw.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { sectionNumber: "asc" },
      },
      cases: true,
    },
  });

  if (!law) {
    notFound();
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 font-sans">
      <Link href="/academic/laws" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        กลับไปคลังกฎหมาย
      </Link>

      {/* Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 p-3 rounded-2xl">
              <Scale className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                  {law.category}
                </span>
                <span className="text-slate-400 text-xs font-semibold">{law.lawCode}</span>
              </div>
              <LawStatusBadge status={law.status} />
            </div>
          </div>
          {law.officialUrl && (
            <a 
              href={law.officialUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-xl border border-slate-200 transition-colors"
            >
              ต้นฉบับ <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">{law.lawNameTh}</h1>
        {law.lawNameEn && <h2 className="text-lg text-slate-500 font-medium mb-6">{law.lawNameEn}</h2>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 p-2 rounded-lg">
              <Landmark className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">หน่วยงานรับผิดชอบ</p>
              <p className="text-sm font-semibold text-slate-700">{law.regulator}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">ปีที่บังคับใช้</p>
              <p className="text-sm font-semibold text-slate-700">{law.year || "ไม่ระบุ"}</p>
            </div>
          </div>
        </div>

        {law.description && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-slate-600 leading-relaxed text-sm">{law.description}</p>
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <List className="w-6 h-6 text-indigo-500" />
          มาตราสำคัญและบทกำหนดโทษ
        </h3>

        {law.sections.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">ยังไม่มีข้อมูลมาตราในระบบ</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {law.sections.map((section) => (
              <div key={section.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h4 className="text-lg font-bold text-slate-900">
                    มาตรา {section.sectionNumber} <span className="text-indigo-600">{section.title}</span>
                  </h4>
                  <div className="flex gap-2">
                    {section.penaltySummary && (
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                        มีบทลงโทษ
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line mb-4 bg-slate-50 p-4 rounded-xl">
                  {section.contentSummary}
                </p>

                {section.penaltySummary && (
                  <div className="flex items-start gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                    <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-rose-700 uppercase mb-1">บทกำหนดโทษ</p>
                      <p className="text-sm font-semibold text-rose-900">{section.penaltySummary}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cases */}
      {law.cases.length > 0 && (
        <div className="space-y-4 mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-rose-500" />
            กรณีศึกษาที่เกี่ยวข้อง (Case Studies)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {law.cases.map(c => (
              <Link href={`/academic/cases/${c.id}`} key={c.id}>
                <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-rose-300 transition-colors flex gap-4 items-center group">
                  <div className="bg-rose-50 p-3 rounded-lg group-hover:bg-rose-100 transition-colors">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{c.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">ความเสี่ยง: {c.riskLevel}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LawStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "CURRENT":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          บังคับใช้ปัจจุบัน
        </span>
      );
    case "REPEALED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3.5 h-3.5" />
          ยกเลิกแล้ว
        </span>
      );
    case "VERIFY":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
          <HelpCircle className="w-3.5 h-3.5" />
          รอตรวจสอบ
        </span>
      );
    default:
      return null;
  }
}

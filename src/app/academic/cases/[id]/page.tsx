import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, BookOpen, AlertTriangle, ArrowDown, CheckCircle, Navigation } from "lucide-react";

export default async function CaseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  const caseStudy = await prisma.knowledgeCase.findUnique({
    where: { id },
    include: {
      knowledgeLaw: true
    },
  });

  if (!caseStudy) {
    notFound();
  }



  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 font-sans">
      <Link href="/academic/cases" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-rose-600 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        กลับไปหน้ารวมกรณีศึกษา
      </Link>

      {/* Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-rose-50 p-3 rounded-2xl">
            <BookOpen className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getRiskBadgeStyle(caseStudy.riskLevel)} mb-1 inline-block`}>
              ระดับความเสี่ยง: {caseStudy.riskLevel}
            </span>
            <div className="text-slate-400 text-xs font-semibold">CASE: {caseStudy.id}</div>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 leading-snug">{caseStudy.title}</h1>
        
        <p className="text-slate-600 leading-relaxed text-sm bg-slate-50 p-5 rounded-2xl border border-slate-100">
          {caseStudy.scenario}
        </p>

        {caseStudy.knowledgeLaw && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">กฎหมายที่เกี่ยวข้อง</p>
            <Link href={`/academic/laws/${caseStudy.knowledgeLawId}`} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl border border-indigo-200 transition-colors">
              <BookOpen className="w-4 h-4" />
              {caseStudy.knowledgeLaw.lawNameTh}
            </Link>
          </div>
        )}
      </div>

      {/* Workflow Diagram */}
      <div className="space-y-6">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Navigation className="w-6 h-6 text-indigo-500" />
          แนวทางการจัดการ (Workflow)
        </h3>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200 md:left-1/2 md:-ml-[1px]" />
            
            <div className="space-y-8 relative">
              
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="hidden md:block flex-1" />
                <div className="relative z-10 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md border-4 border-white flex-shrink-0 mx-0 md:mx-auto">1</div>
                <div className="flex-1 w-full bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-lg mb-2">สิ่งที่ควรทำ / แนวทางจัดการ</h4>
                  <p className="text-slate-600 text-sm">{caseStudy.recommendedAction}</p>
                </div>
              </div>

              {caseStudy.evidenceRequired && (
                <div className="flex flex-col md:flex-row-reverse items-start gap-6">
                  <div className="hidden md:block flex-1" />
                  <div className="relative z-10 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md border-4 border-white flex-shrink-0 mx-0 md:mx-auto">2</div>
                  <div className="flex-1 w-full bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 text-lg mb-2">พยานหลักฐานที่ต้องใช้</h4>
                    <p className="text-slate-600 text-sm">{caseStudy.evidenceRequired}</p>
                  </div>
                </div>
              )}

              {caseStudy.referralAgency && (
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="hidden md:block flex-1" />
                  <div className="relative z-10 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md border-4 border-white flex-shrink-0 mx-0 md:mx-auto">3</div>
                  <div className="flex-1 w-full bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 text-lg mb-2">หน่วยงานที่ต้องส่งต่อ</h4>
                    <p className="text-slate-600 text-sm">{caseStudy.referralAgency}</p>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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

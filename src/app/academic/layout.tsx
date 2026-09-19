import React from "react";
import { BookOpen, Scale, FileText, AlertTriangle, HelpCircle, ShieldCheck, Download, Search } from "lucide-react";
import Link from "next/link";

export default function AcademicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col md:flex-row font-sans bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col hidden md:flex border-r border-slate-800 sticky top-16 h-[calc(100vh-64px)]">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm">ศูนย์วิชาการและกฎหมาย</h1>
            <p className="text-[10px] text-slate-400">KBS Academic Center</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4 px-3">ภาพรวม</div>
            <Link href="/academic" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 hover:text-white transition-colors">
              <Search className="h-4 w-4" />
              หน้าหลัก (Dashboard)
            </Link>

            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-3">ขอบเขตงาน</div>
            <Link href="/academic/duties" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 hover:text-white transition-colors">
              <ShieldCheck className="h-4 w-4" />
              ระดับจังหวัด vs อำเภอ
            </Link>

            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-3">กฎหมาย</div>
            <Link href="/academic/laws" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 hover:text-white transition-colors">
              <Scale className="h-4 w-4" />
              คลังกฎหมาย คบส.
            </Link>

            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-3">แหล่งเรียนรู้</div>
            <Link href="/academic/cases" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 hover:text-white transition-colors">
              <FileText className="h-4 w-4" />
              Case Study ที่พบบ่อย
            </Link>
            <Link href="/academic/interpretation" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 hover:text-white transition-colors">
              <AlertTriangle className="h-4 w-4" />
              แนวทางการตีความ
            </Link>

            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-3">ทรัพยากร</div>
            <Link href="/academic/downloads" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 hover:text-white transition-colors">
              <Download className="h-4 w-4" />
              ดาวน์โหลดเอกสาร
            </Link>
            <Link href="/academic/faq" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 hover:text-white transition-colors">
              <HelpCircle className="h-4 w-4" />
              คำถามที่พบบ่อย (FAQ)
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <p>จัดทำเพื่อสนับสนุนการปฏิบัติงาน ไม่ใช่ตัวบทกฎหมายทางการ</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="md:hidden bg-slate-900 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            <span className="font-bold">ศูนย์วิชาการและกฎหมาย</span>
          </div>
          <Link href="/" className="text-sm text-slate-300">กลับระบบหลัก</Link>
        </div>
        
        <div className="flex-1 relative">
          {children}
        </div>
      </main>
    </div>
  );
}

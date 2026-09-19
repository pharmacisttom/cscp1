import React from "react";
import Link from "next/link";
import { Shield, Map, Scale, BookOpen, AlertCircle, FileSearch, ArrowRight, UserCheck, FileText, BrainCircuit } from "lucide-react";

export const metadata = {
  title: "ศูนย์วิชาการและกฎหมาย (KBS Academic & Legal Knowledge Center)",
};

export default function AcademicDashboardPage() {
  const mainCards = [
    {
      id: "01",
      title: "ผลิตภัณฑ์สุขภาพ",
      subtitle: "Health Products",
      icon: <Shield className="h-8 w-8 text-blue-500" />,
      href: "/academic/laws?category=products",
      color: "bg-blue-50 border-blue-200 hover:border-blue-500",
      description: "ยา, อาหาร, เครื่องสำอาง, เครื่องมือแพทย์, สมุนไพร, วัตถุอันตราย, ยาเสพติด"
    },
    {
      id: "02",
      title: "สถานบริการสุขภาพ",
      subtitle: "Health Services",
      icon: <Map className="h-8 w-8 text-emerald-500" />,
      href: "/academic/laws?category=services",
      color: "bg-emerald-50 border-emerald-200 hover:border-emerald-500",
      description: "คลินิก, โรงพยาบาลเอกชน, สถานประกอบการเพื่อสุขภาพ, สปา, นวดเพื่อสุขภาพ"
    },
    {
      id: "03",
      title: "ขอบเขตหน้าที่จังหวัด",
      subtitle: "Provincial Responsibilities",
      icon: <UserCheck className="h-8 w-8 text-indigo-500" />,
      href: "/academic/duties#province",
      color: "bg-indigo-50 border-indigo-200 hover:border-indigo-500",
      description: "อำนาจหน้าที่ สสจ., การอนุญาต, เฝ้าระวัง, บังคับใช้กฎหมาย, ดำเนินคดี"
    },
    {
      id: "04",
      title: "ขอบเขตหน้าที่อำเภอ",
      subtitle: "District Responsibilities",
      icon: <FileSearch className="h-8 w-8 text-amber-500" />,
      href: "/academic/duties#district",
      color: "bg-amber-50 border-amber-200 hover:border-amber-500",
      description: "อำนาจหน้าที่ระดับอำเภอ, รพช., รพ.สต., การตรวจสอบเบื้องต้น, รับเรื่องร้องเรียน"
    },
    {
      id: "05",
      title: "กฎหมายและการตีความ",
      subtitle: "Laws & Legal Interpretation",
      icon: <Scale className="h-8 w-8 text-purple-500" />,
      href: "/academic/interpretation",
      color: "bg-purple-50 border-purple-200 hover:border-purple-500",
      description: "แนวทางการตีความกฎหมาย 8 ขั้นตอนสำหรับงาน คบส., องค์ประกอบความผิด"
    },
    {
      id: "06",
      title: "กรณีศึกษาที่พบบ่อย",
      subtitle: "Case Based Learning",
      icon: <BookOpen className="h-8 w-8 text-rose-500" />,
      href: "/academic/cases",
      color: "bg-rose-50 border-rose-200 hover:border-rose-500",
      description: "ตัวอย่าง 15 กรณีศึกษา, แนวทางจัดการร้านชำขายยา, คลินิกเถื่อน, อาหารปลอม"
    },
    {
      id: "07",
      title: "มาตรฐานการปฏิบัติงาน",
      subtitle: "SOPs & Guidelines",
      icon: <FileText className="h-8 w-8 text-cyan-500" />,
      href: "/academic/sop",
      color: "bg-cyan-50 border-cyan-200 hover:border-cyan-500",
      description: "ขั้นตอนการปฏิบัติงานมาตรฐาน (SOP) เช่น การจัดการร้านชำขายยา, คลินิกเถื่อน"
    },
    {
      id: "08",
      title: "ระบบสนับสนุนการตัดสินใจ",
      subtitle: "Decision Support",
      icon: <BrainCircuit className="h-8 w-8 text-fuchsia-500" />,
      href: "/decision-support",
      color: "bg-fuchsia-50 border-fuchsia-200 hover:border-fuchsia-500",
      description: "AI Legal Assistant, วิเคราะห์ความเสี่ยงเบื้องต้น, ค้นหาความเป็นไปได้ของความผิด"
    },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 font-sans">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <Scale className="w-96 h-96" />
        </div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/50 text-indigo-200 text-xs font-semibold mb-6">
            <BookOpen className="h-4 w-4" />
            Knowledge Base System
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            งานคุ้มครองผู้บริโภคด้านสาธารณสุข
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 font-medium mb-8">
            ขอบเขตหน้าที่ • กฎหมาย • การเฝ้าระวัง • การตรวจสอบ • การบังคับใช้กฎหมาย
          </p>
          
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex-1 min-w-[200px]">
              <div className="text-indigo-200 text-xs font-bold uppercase tracking-wide mb-1">ค้นหากฎหมายด่วน</div>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="ค้นหาชื่อกฎหมาย, มาตรา, กรณีศึกษา..." 
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-2 pl-3 pr-10 text-white placeholder-indigo-200/50 outline-none focus:bg-white/20 transition-all text-sm"
                />
                <SearchIcon className="absolute right-3 top-1.5 h-5 w-5 text-indigo-300" />
              </div>
            </div>
            
            <Link 
              href="/academic/interpretation"
              className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl p-4 border border-indigo-400 flex flex-col justify-center items-center gap-1 transition-colors min-w-[150px] shadow-lg shadow-indigo-500/20"
            >
              <AlertCircle className="h-6 w-6" />
              <span className="text-sm font-bold">พบเหตุการณ์นี้ทำอย่างไร?</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6 Main Cards */}
      <section>
        <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
          หมวดหมู่หลัก (Main Categories)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainCards.map((card) => (
            <Link href={card.href} key={card.id}>
              <div className={`group relative h-full rounded-2xl border-2 p-6 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col ${card.color}`}>
                <div className="absolute top-6 right-6 text-slate-300 font-black text-4xl opacity-50 group-hover:opacity-100 transition-opacity">
                  {card.id}
                </div>
                <div className="mb-4">
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">{card.title}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">{card.subtitle}</p>
                
                <div className="mt-auto pt-4 flex items-end justify-between gap-4">
                  <p className="text-sm text-slate-600 line-clamp-2 flex-1">
                    {card.description}
                  </p>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-slate-800 transition-colors flex-shrink-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Warning Alert */}
      <section>
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-amber-800 font-bold text-lg mb-1">คำเตือนด้านอำนาจทางกฎหมาย (Authority Warning)</h4>
              <p className="text-amber-700 text-sm">
                เจ้าหน้าที่ระดับอำเภอไม่ได้มีอำนาจตามกฎหมายทุกฉบับโดยอัตโนมัติ ต้องตรวจสอบการแต่งตั้งเป็นพนักงานเจ้าหน้าที่และคำสั่งมอบอำนาจก่อนใช้อำนาจตามกฎหมายทุกครั้ง
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

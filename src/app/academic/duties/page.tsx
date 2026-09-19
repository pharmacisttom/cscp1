import React from "react";
import { ShieldCheck, UserCheck, FileSearch, Building, Stethoscope, AlertTriangle, Scale, Target, Activity, Home, Megaphone, Search } from "lucide-react";

export const metadata = {
  title: "ขอบเขตหน้าที่ (Duties & Responsibilities) - ศูนย์วิชาการ",
};

export default function DutiesPage() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-teal-600" />
            ขอบเขตหน้าที่และความรับผิดชอบ
          </h1>
          <p className="text-slate-500 mt-2">
            เปรียบเทียบอำนาจหน้าที่การทำงานระหว่าง สสจ. (Level 1), อำเภอ/รพช. (Level 2) และ รพ.สต. (Level 3)
          </p>
        </div>
      </div>

      {/* Authority Warning */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-amber-800 font-bold text-lg mb-1">คำเตือนด้านอำนาจทางกฎหมาย (Authority Warning)</h4>
            <p className="text-amber-700 text-sm">
              อำนาจจริงต้องตรวจสอบบทบัญญัติของกฎหมาย การแต่งตั้งพนักงานเจ้าหน้าที่ คำสั่งมอบอำนาจ และเขตอำนาจก่อนทุกครั้ง ห้ามดำเนินการโดยไม่ได้ตรวจสอบสถานะพนักงานเจ้าหน้าที่ของตนเอง
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Level 1: Province */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Building className="w-32 h-32 text-indigo-900" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-100 p-3 rounded-2xl">
                <UserCheck className="w-6 h-6 text-indigo-700" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">ระดับจังหวัด (Level 1)</h2>
                <p className="text-sm font-semibold text-indigo-600">สำนักงานสาธารณสุขจังหวัด (สสจ.)</p>
              </div>
            </div>

            <div className="space-y-4">
              <DutyItem 
                icon={<Scale className="w-5 h-5 text-slate-400" />}
                title="การอนุญาต (Licensing)"
                desc="มีอำนาจในการพิจารณาอนุญาต อนุมัติ และออกใบอนุญาตต่างๆ เช่น ใบอนุญาตสถานพยาบาล คลินิก ร้านขายยา"
              />
              <DutyItem 
                icon={<Target className="w-5 h-5 text-slate-400" />}
                title="การบังคับใช้กฎหมาย (Enforcement)"
                desc="เปรียบเทียบปรับ สั่งพักใช้หรือเพิกถอนใบอนุญาต ดำเนินคดีกับผู้ฝ่าฝืนกฎหมาย"
              />
              <DutyItem 
                icon={<AlertTriangle className="w-5 h-5 text-slate-400" />}
                title="การจัดการเรื่องร้องเรียน (Complaints)"
                desc="รับเรื่องร้องเรียนที่ซับซ้อน หรือกรณีที่อำเภอส่งต่อมาเพื่อดำเนินการทางกฎหมายขั้นเด็ดขาด"
              />
              <DutyItem 
                icon={<ShieldCheck className="w-5 h-5 text-slate-400" />}
                title="กำหนดนโยบายและเป้าหมาย"
                desc="กำหนดเป้าหมายการเฝ้าระวังประจำปี (KPIs) และจัดสรรงบประมาณให้อำเภอ"
              />
            </div>
          </div>
        </div>

        {/* Level 2: District */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Stethoscope className="w-32 h-32 text-amber-900" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-100 p-3 rounded-2xl">
                <FileSearch className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">ระดับอำเภอ (Level 2)</h2>
                <p className="text-sm font-semibold text-amber-600">อำเภอ / รพช.</p>
              </div>
            </div>

            <div className="space-y-4">
              <DutyItem 
                icon={<FileSearch className="w-5 h-5 text-slate-400" />}
                title="การเฝ้าระวัง (Surveillance)"
                desc="ลงพื้นที่ตรวจสอบสถานที่ผลิต ขาย หรือให้บริการ ตามแผนประจำปีที่ สสจ. กำหนด"
              />
              <DutyItem 
                icon={<Target className="w-5 h-5 text-slate-400" />}
                title="ตรวจสอบเบื้องต้น (Primary Check)"
                desc="ตรวจจับผลิตภัณฑ์สุขภาพที่ไม่ได้มาตรฐาน หรือสถานประกอบการเถื่อน แจ้งเตือนและให้คำแนะนำเบื้องต้น"
              />
              <DutyItem 
                icon={<AlertTriangle className="w-5 h-5 text-slate-400" />}
                title="รับเรื่องร้องเรียนเบื้องต้น"
                desc="รับแจ้งเบาะแสจากประชาชนในพื้นที่ ตรวจสอบข้อเท็จจริง และรายงานผลให้จังหวัดทราบ"
              />
              <DutyItem 
                icon={<ShieldCheck className="w-5 h-5 text-slate-400" />}
                title="การทำงานร่วมกับเครือข่าย"
                desc="สร้างเครือข่าย อสม., ผู้นำชุมชน เพื่อเฝ้าระวังความปลอดภัยด้านสุขภาพในชุมชน"
              />
            </div>
          </div>
        </div>

        {/* Level 3: Primary Care */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Home className="w-32 h-32 text-emerald-900" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-100 p-3 rounded-2xl">
                <Activity className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">ระดับปฐมภูมิ (Level 3)</h2>
                <p className="text-sm font-semibold text-emerald-600">รพ.สต. / ศูนย์บริการสาธารณสุข</p>
              </div>
            </div>

            <div className="space-y-4">
              <DutyItem 
                icon={<Search className="w-5 h-5 text-slate-400" />}
                title="การเฝ้าระวังและสังเกตการณ์"
                desc="เน้นการสังเกตผลิตภัณฑ์เสี่ยงหรือสถานประกอบการผิดกฎหมายในพื้นที่รับผิดชอบระดับตำบล"
              />
              <DutyItem 
                icon={<Megaphone className="w-5 h-5 text-slate-400" />}
                title="แจ้งเตือนประชาชน"
                desc="สื่อสารและแจ้งเตือนความเสี่ยงด้านสุขภาพให้ประชาชนในพื้นที่รับทราบ"
              />
              <DutyItem 
                icon={<AlertTriangle className="w-5 h-5 text-slate-400" />}
                title="รับแจ้งปัญหา"
                desc="เป็นด่านหน้ารับเรื่องร้องเรียน เก็บข้อมูลเบื้องต้น ประสานและส่งต่อข้อมูลให้หน่วยงานระดับอำเภอ"
              />
              <DutyItem 
                icon={<ShieldCheck className="w-5 h-5 text-slate-400" />}
                title="ขอบเขตทางกฎหมาย"
                desc="ไม่มีอำนาจทางกฎหมายโดยอัตโนมัติ (ห้ามจับกุมหรือเปรียบเทียบปรับเองโดยเด็ดขาด)"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm overflow-hidden">
        <h3 className="text-xl font-black text-slate-800 mb-6">Responsibility Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="py-4 px-4 font-bold text-slate-700 text-sm">กิจกรรม / กระบวนงาน</th>
                <th className="py-4 px-4 font-bold text-center text-indigo-700 text-sm w-32 border-l border-slate-200">จังหวัด (สสจ.)</th>
                <th className="py-4 px-4 font-bold text-center text-amber-700 text-sm w-32 border-l border-slate-200">อำเภอ (หน่วยงานอำเภอ/รพช.)</th>
                <th className="py-4 px-4 font-bold text-center text-emerald-700 text-sm w-32 border-l border-slate-200">ปฐมภูมิ (รพ.สต.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              <MatrixRow 
                task="รับคำขออนุญาตตั้งคลินิก / ร้านขายยา"
                prov="อนุมัติ"
                dist="รับเรื่อง/ตรวจสถานที่"
                prim="แจ้งข้อมูล"
              />
              <MatrixRow 
                task="ตรวจเฝ้าระวังตามแผนประจำปี"
                prov="กำกับดูแล/สุ่มตรวจ"
                dist="ดำเนินการหลัก"
                prim="ร่วมเฝ้าระวัง"
              />
              <MatrixRow 
                task="การเปรียบเทียบปรับตามกฎหมาย"
                prov="ดำเนินการหลัก"
                dist="ส่งเรื่องให้จังหวัด"
                prim="ไม่มีอำนาจ"
              />
              <MatrixRow 
                task="จับกุมผู้กระทำผิด (คลินิกเถื่อน/หมอเถื่อน)"
                prov="ร่วมกับตำรวจ"
                dist="ชี้เป้า/รายงาน"
                prim="แจ้งเบาะแส"
              />
              <MatrixRow 
                task="ให้คำปรึกษาทางวิชาการและกฎหมาย"
                prov="ดำเนินการหลัก"
                dist="ผู้ขอคำปรึกษา"
                prim="ผู้ขอคำปรึกษา"
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DutyItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl">
      <div className="mt-0.5">{icon}</div>
      <div>
        <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function MatrixRow({ task, prov, dist, prim }: { task: string, prov: string, dist: string, prim: string }) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="py-4 px-4 font-medium">{task}</td>
      <td className="py-4 px-4 text-center border-l border-slate-100">
        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-full">
          {prov}
        </span>
      </td>
      <td className="py-4 px-4 text-center border-l border-slate-100">
        <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 font-semibold text-xs rounded-full">
          {dist}
        </span>
      </td>
      <td className="py-4 px-4 text-center border-l border-slate-100">
        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-full">
          {prim}
        </span>
      </td>
    </tr>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, Trophy, Smartphone, MapPin, Calendar, CheckCircle2, ChevronRight, Activity } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

export default function WorkspacePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  const fetchWorkspaceData = async () => {
    try {
      const res = await fetch("/api/workspace/summary");
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">กำลังโหลดพื้นที่ทำงาน...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500">ไม่สามารถโหลดข้อมูลได้</div>;
  }

  const { officer, performance, todaysStops, leaderboard } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-teal-600" />
            พื้นที่ทำงานของฉัน (My Workspace)
          </h1>
          <p className="text-slate-500 mt-1">
            ยินดีต้อนรับ, <span className="font-bold text-slate-700">{officer.fullName}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Tasks & Performance */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Link 
              href="/inspections/field"
              className="bg-teal-600 text-white rounded-2xl p-4 shadow-sm hover:bg-teal-700 transition flex flex-col items-center justify-center gap-2"
            >
              <Smartphone className="h-8 w-8" />
              <span className="font-bold">โหมดลงพื้นที่ (Field GPS)</span>
            </Link>
            <Link 
              href="/map"
              className="bg-indigo-600 text-white rounded-2xl p-4 shadow-sm hover:bg-indigo-700 transition flex flex-col items-center justify-center gap-2"
            >
              <MapPin className="h-8 w-8" />
              <span className="font-bold">ดูแผนที่เขตรับผิดชอบ</span>
            </Link>
          </div>

          {/* Today's Tasks */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal-600" />
                ภารกิจของวันนี้ ({format(new Date(), "d MMMM", { locale: th })})
              </h2>
              <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full text-xs font-bold">
                {todaysStops.length} รายการ
              </span>
            </div>
            
            <div className="divide-y divide-slate-100">
              {todaysStops.length > 0 ? (
                todaysStops.map((stop: any, index: number) => (
                  <div key={stop.id} className="p-4 hover:bg-slate-50 transition flex items-center gap-4">
                    <div className="flex-shrink-0 h-10 w-10 bg-teal-50 rounded-full flex items-center justify-center font-bold text-teal-700 border border-teal-100">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">{stop.business.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> ต.{stop.business.location?.subdistrict}
                      </p>
                    </div>
                    <div>
                      {stop.status === 'COMPLETED' ? (
                        <span className="flex items-center gap-1 text-emerald-600 text-sm font-bold">
                          <CheckCircle2 className="h-4 w-4" /> ตรวจแล้ว
                        </span>
                      ) : (
                        <Link 
                          href={`/inspections/field?businessId=${stop.businessId}`}
                          className="bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 p-2 rounded-lg transition-colors flex items-center"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                  <CheckCircle2 className="h-12 w-12 text-slate-200 mb-2" />
                  <p>ไม่มีภารกิจที่ถูกมอบหมายในวันนี้</p>
                  <p className="text-xs mt-1">คุณสามารถใช้ โหมดลงพื้นที่ เพื่อตรวจอิสระได้</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Leaderboard & Stats */}
        <div className="space-y-6">
          
          {/* Performance Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-indigo-600" />
              ผลงานเดือนนี้
            </h2>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-slate-900">{performance.monthlyInspections}</span>
              <span className="text-slate-500 font-medium mb-1">แห่งที่ตรวจสำเร็จ</span>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-amber-100 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold text-amber-900">Leaderboard ประจำอำเภอ</h2>
            </div>
            <div className="p-2 space-y-1">
              {leaderboard.length > 0 ? (
                leaderboard.map((lb: any, index: number) => (
                  <div 
                    key={index} 
                    className={`flex items-center gap-3 p-3 rounded-xl ${lb.isMe ? 'bg-white border border-amber-200 shadow-sm' : ''}`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-slate-300 text-slate-800' :
                      index === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className={`flex-1 text-sm ${lb.isMe ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {lb.officerName} {lb.isMe && <span className="text-xs text-amber-600 ml-1">(คุณ)</span>}
                    </div>
                    <div className="font-black text-slate-800">
                      {lb.count}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-amber-700">ไม่มีข้อมูลการตรวจในเดือนนี้</div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

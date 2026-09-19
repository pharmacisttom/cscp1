"use client";

import { useState, useEffect } from "react";
import { Target, Calendar, CheckCircle2, Lock, Unlock, AlertCircle } from "lucide-react";

export default function DistrictGoalsPage() {
  const [districtGoals, setDistrictGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/goals");
      if (res.ok) {
        const json = await res.json();
        setDistrictGoals(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openSelectionModal = async (dg: any) => {
    setSelectedGoal(dg);
    setSelectedBusinessIds(dg.businesses.map((b: any) => b.businessId));
    setShowModal(true);
    
    // Fetch businesses for this district, optionally filtered by goal's businessType
    let url = "/api/businesses?";
    if (dg.goal.businessTypeId) {
      url += `businessTypeId=${dg.goal.businessTypeId}`;
    }
    
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setBusinesses(json.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const toggleBusinessSelection = (id: string) => {
    if (selectedBusinessIds.includes(id)) {
      setSelectedBusinessIds(prev => prev.filter(bid => bid !== id));
    } else {
      if (selectedBusinessIds.length >= selectedGoal.targetCount) {
        alert(`คุณเลือกครบจำนวนเป้าหมายแล้ว (${selectedGoal.targetCount} แห่ง)`);
        return;
      }
      setSelectedBusinessIds(prev => [...prev, id]);
    }
  };

  const saveSelection = async () => {
    try {
      const res = await fetch(`/api/goals/${selectedGoal.id}/select-businesses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessIds: selectedBusinessIds })
      });
      
      if (res.ok) {
        setShowModal(false);
        fetchGoals();
      } else {
        const err = await res.json();
        alert("Error: " + err.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Target className="h-6 w-6 text-teal-600" />
          เป้าหมายและตัวชี้วัด (KPIs)
        </h1>
        <p className="text-slate-500 text-sm mt-1">เลือกกลุ่มเป้าหมายเพื่อดำเนินการให้บรรลุตามที่ สสจ. กำหนด</p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">กำลังโหลดข้อมูล...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {districtGoals.map(dg => {
            const isLocked = new Date(dg.goal.deadline) < new Date();
            const currentCount = dg.businesses.length;
            const progressPercent = dg.targetCount > 0 ? Math.min(100, Math.round((currentCount / dg.targetCount) * 100)) : 100;
            const isCompleted = currentCount >= dg.targetCount;

            return (
              <div key={dg.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {isLocked ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1"><Lock className="h-3 w-3"/> หมดเวลาเลือก</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1"><Unlock className="h-3 w-3"/> เปิดให้เลือกเป้าหมาย</span>
                      )}
                      <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-xs font-bold rounded-full">ปี {dg.goal.fiscalYear}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{dg.goal.title}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar className="h-4 w-4" /> ปิดล็อค: {new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }).format(new Date(dg.goal.deadline))}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-black text-slate-800">{currentCount}<span className="text-lg text-slate-400">/{dg.targetCount}</span></div>
                    <div className="text-xs text-slate-500 font-bold">แห่ง</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className={isCompleted ? "text-emerald-600" : "text-slate-600"}>
                      {isCompleted ? "เลือกเป้าหมายครบแล้ว" : "ยังขาดอีก " + (dg.targetCount - currentCount) + " แห่ง"}
                    </span>
                    <span className="text-slate-600">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${isCompleted ? "bg-emerald-500" : "bg-teal-500"}`} style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>

                {!isLocked && (
                  <button 
                    onClick={() => openSelectionModal(dg)}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors ${isCompleted ? "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200" : "bg-teal-600 text-white hover:bg-teal-700"}`}
                  >
                    {isCompleted ? "จัดการกลุ่มเป้าหมาย" : "เลือกกลุ่มเป้าหมาย (Select Targets)"}
                  </button>
                )}

                {/* Selected List Preview */}
                {dg.businesses.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-xs font-bold text-slate-600 mb-2">รายชื่อที่ถูกเลือก:</h4>
                    <div className="space-y-2">
                      {dg.businesses.slice(0, 3).map((b: any) => (
                        <div key={b.id} className="text-xs flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-slate-700 font-medium">{b.business.name}</span>
                          <span className="text-slate-400 ml-auto">{b.status === "INSPECTED" ? "ตรวจแล้ว" : "รอดำเนินการ"}</span>
                        </div>
                      ))}
                      {dg.businesses.length > 3 && (
                        <div className="text-xs text-slate-400 text-center pt-1">+ อีก {dg.businesses.length - 3} แห่ง</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {districtGoals.length === 0 && (
            <div className="text-center py-10 text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed flex flex-col items-center">
              <AlertCircle className="h-10 w-10 text-slate-300 mb-2" />
              <p>ยังไม่มีเป้าหมายที่ถูกส่งมาให้อำเภอของคุณในปีนี้</p>
            </div>
          )}
        </div>
      )}

      {/* Selection Modal */}
      {showModal && selectedGoal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-bold text-lg text-slate-800">เลือกกลุ่มเป้าหมาย</h3>
              <p className="text-xs text-slate-500">เป้าหมาย: {selectedGoal.goal.title}</p>
              <div className="mt-2 bg-teal-50 text-teal-800 px-3 py-2 rounded-lg text-sm font-bold flex justify-between">
                <span>เลือกแล้ว: {selectedBusinessIds.length} / {selectedGoal.targetCount}</span>
                <span>เหลืออีก: {Math.max(0, selectedGoal.targetCount - selectedBusinessIds.length)}</span>
              </div>
            </div>
            
            <div className="p-4 border-b bg-slate-50">
              <input 
                type="text" 
                placeholder="ค้นหาสถานประกอบการ..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {businesses
                .filter(b => b.name.includes(search))
                .map(b => (
                <div 
                  key={b.id} 
                  onClick={() => toggleBusinessSelection(b.id)}
                  className={`p-3 border-b last:border-0 flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedBusinessIds.includes(b.id) ? "bg-teal-50/50" : ""}`}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedBusinessIds.includes(b.id)} 
                    readOnly
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-800">{b.name}</div>
                    <div className="text-xs text-slate-500">ต.{b.location?.subdistrict} • {b.businessType?.name}</div>
                  </div>
                </div>
              ))}
              {businesses.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">ไม่พบข้อมูลสถานประกอบการ</div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end gap-2 bg-slate-50 rounded-b-2xl">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button 
                onClick={saveSelection}
                className="px-4 py-2 text-sm font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700"
              >
                บันทึกการเลือกเป้าหมาย
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

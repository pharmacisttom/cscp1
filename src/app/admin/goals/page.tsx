"use client";

import { useState, useEffect } from "react";
import { Target, Calendar, Plus, ShieldCheck, Lock, Unlock, Users, Building2 } from "lucide-react";

export default function AdminGoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear() + 543);
  const [deadline, setDeadline] = useState("");
  const [businessTypeId, setBusinessTypeId] = useState("");
  const [targets, setTargets] = useState([
    { district: "เมืองระยอง", targetCount: 0 },
    { district: "แกลง", targetCount: 0 },
    { district: "บ้านค่าย", targetCount: 0 },
    { district: "ปลวกแดง", targetCount: 0 },
    { district: "บ้านฉาง", targetCount: 0 },
    { district: "วังจันทร์", targetCount: 0 },
    { district: "เขาชะเมา", targetCount: 0 },
    { district: "นิคมพัฒนา", targetCount: 0 },
  ]);

  useEffect(() => {
    fetchGoals();
    fetchBusinessTypes();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/admin/goals");
      if (res.ok) {
        const json = await res.json();
        setGoals(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessTypes = async () => {
    try {
      const res = await fetch("/api/business-types");
      if (res.ok) {
        const json = await res.json();
        setBusinessTypes(json.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: "",
          fiscalYear,
          businessTypeId: businessTypeId || null,
          deadline,
          targets: targets.filter(t => t.targetCount > 0)
        })
      });
      if (res.ok) {
        setShowForm(false);
        fetchGoals();
        setTitle("");
      } else {
        alert("Error creating goal");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUnlock = async (id: string) => {
    const newDeadline = prompt("ระบุวันสิ้นสุดใหม่ (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
    if (!newDeadline) return;

    try {
      const res = await fetch(`/api/admin/goals/${id}/unlock`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newDeadline })
      });
      if (res.ok) {
        fetchGoals();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const calculateTotalProgress = (districtGoals: any[]) => {
    let totalTarget = 0;
    let totalInspected = 0; // Requires actual inspection counts (for now we might not have it unless we join GoalBusiness)
    
    // We didn't include goalBusinesses in the API, we can just sum targetCount for now
    districtGoals.forEach(dg => {
      totalTarget += dg.targetCount;
      // if we had dg.businesses we could count status === 'INSPECTED'
    });
    return { totalTarget, totalInspected };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Target className="h-6 w-6 text-indigo-600" />
            บริหารจัดการเป้าหมายระดับจังหวัด (KPIs)
          </h1>
          <p className="text-slate-500 text-sm mt-1">กำหนดตัวชี้วัดและกระจายเป้าหมายไปยังแต่ละอำเภอ</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> สร้างเป้าหมายใหม่
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">ฟอร์มสร้างเป้าหมายใหม่</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">หัวข้อเป้าหมาย</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-lg p-2 text-sm" placeholder="เช่น ตรวจเฝ้าระวังคลินิกเอกชน 100%" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ปีงบประมาณ (พ.ศ.)</label>
                <input required type="number" value={fiscalYear} onChange={e => setFiscalYear(Number(e.target.value))} className="w-full border rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ประเภทสถานประกอบการ (ตัวกรอง)</label>
                <select value={businessTypeId} onChange={e => setBusinessTypeId(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
                  <option value="">-- ไม่ระบุ (รวมทุกประเภท) --</option>
                  {businessTypes.map(bt => (
                    <option key={bt.id} value={bt.id}>{bt.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">วันสิ้นสุดการล็อคเป้าหมาย (Deadline)</label>
                <input required type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
              </div>
            </div>

            <div className="pt-4">
              <label className="block text-sm font-bold text-slate-800 mb-2">กำหนดเป้าหมายแต่ละอำเภอ (จำนวนแห่ง)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {targets.map((t, idx) => (
                  <div key={t.district} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-600 block mb-1">{t.district}</span>
                    <input 
                      type="number" 
                      min="0"
                      value={t.targetCount} 
                      onChange={e => {
                        const newTargets = [...targets];
                        newTargets[idx].targetCount = Number(e.target.value);
                        setTargets(newTargets);
                      }}
                      className="w-full border rounded-lg p-1.5 text-sm text-center font-bold"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">ยกเลิก</button>
              <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">บันทึกเป้าหมาย</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-slate-500">กำลังโหลดข้อมูล...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {goals.map(goal => {
            const isLocked = new Date(goal.deadline) < new Date();
            const { totalTarget } = calculateTotalProgress(goal.districtGoals);

            return (
              <div key={goal.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    {isLocked ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1"><Lock className="h-3 w-3"/> หมดเขต</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1"><Unlock className="h-3 w-3"/> เปิดรับเป้าหมาย</span>
                    )}
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">ปี {goal.fiscalYear}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{goal.title}</h3>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4"/> ปิดล็อค: {new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }).format(new Date(goal.deadline))}</span>
                    {goal.businessType && <span className="flex items-center gap-1"><Building2 className="h-4 w-4"/> {goal.businessType.name}</span>}
                    <span className="flex items-center gap-1"><Target className="h-4 w-4"/> เป้าหมายรวม: {totalTarget} แห่ง</span>
                  </div>
                </div>

                <div className="md:w-64 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 mb-2">เป้าหมายแยกรายอำเภอ</h4>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2">
                    {goal.districtGoals.map((dg: any) => (
                      <div key={dg.id} className="flex justify-between text-xs">
                        <span className="text-slate-600">{dg.district}</span>
                        <span className="font-bold text-slate-800">{dg.targetCount}</span>
                      </div>
                    ))}
                  </div>
                  {isLocked && (
                    <button 
                      onClick={() => handleUnlock(goal.id)}
                      className="mt-3 w-full py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      ปลดล็อค / ขยายเวลา
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {goals.length === 0 && !showForm && (
            <div className="text-center py-10 text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
              ยังไม่มีการกำหนดเป้าหมาย
            </div>
          )}
        </div>
      )}
    </div>
  );
}

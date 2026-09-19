"use client";

import { useState, useEffect } from "react";
import { Users, Briefcase, Plus, UserCheck, LayoutList } from "lucide-react";

export default function DistrictOfficersPage() {
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      const res = await fetch("/api/district/officers");
      if (res.ok) {
        const json = await res.json();
        setOfficers(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = async (officer: any) => {
    setSelectedOfficer(officer);
    setSelectedBusinessIds([]);
    setShowModal(true);
    
    try {
      const res = await fetch("/api/businesses"); // gets businesses for district
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
      setSelectedBusinessIds(prev => [...prev, id]);
    }
  };

  const handleAssign = async () => {
    if (selectedBusinessIds.length === 0) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/district/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officerId: selectedOfficer.id,
          businessIds: selectedBusinessIds,
          title: `แผนตรวจมอบหมาย (${new Date().toLocaleDateString('th-TH')})`
        })
      });
      if (res.ok) {
        setShowModal(false);
        fetchOfficers(); // refresh counts
      } else {
        alert("การมอบหมายล้มเหลว");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-indigo-600" />
          จัดการทีมและมอบหมายงาน (Team Management)
        </h1>
        <p className="text-slate-500 mt-1">กระจายภาระงานและติดตามผลงานของเจ้าหน้าที่ในเขตรับผิดชอบของคุณ</p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">กำลังโหลดข้อมูลทีม...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {officers.map(officer => (
            <div key={officer.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                  {officer.fullName.substring(0, 1)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{officer.fullName}</h3>
                  <p className="text-xs text-slate-500">{officer.position || "พนักงานเจ้าหน้าที่"}</p>
                  {officer.user?.username && (
                    <p className="text-[10px] text-slate-400 mt-0.5">@{officer.user.username}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6 mb-4 grid grid-cols-2 gap-2 flex-1">
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <div className="text-2xl font-black text-slate-800">{officer._count.plansAssigned}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">แผนงานค้าง</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                  <div className="text-2xl font-black text-emerald-700">{officer._count.inspections}</div>
                  <div className="text-[10px] font-bold text-emerald-600 uppercase mt-1">ตรวจสำเร็จทั้งหมด</div>
                </div>
              </div>

              <button 
                onClick={() => openAssignModal(officer)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors"
              >
                <Briefcase className="h-4 w-4" />
                มอบหมายงาน
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {showModal && selectedOfficer && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-indigo-50/50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-lg text-indigo-900">มอบหมายงานให้ {selectedOfficer.fullName}</h3>
                <p className="text-xs text-indigo-600">เลือกสถานที่ที่ต้องการให้ลงตรวจในวันนี้</p>
              </div>
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                {selectedBusinessIds.length}
              </div>
            </div>
            
            <div className="p-3 border-b bg-slate-50">
              <input 
                type="text" 
                placeholder="ค้นหาสถานประกอบการ..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {businesses
                .filter(b => b.name.includes(search))
                .map(b => (
                <div 
                  key={b.id} 
                  onClick={() => toggleBusinessSelection(b.id)}
                  className={`p-3 border-b border-slate-100 last:border-0 flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedBusinessIds.includes(b.id) ? "bg-indigo-50/50" : ""}`}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedBusinessIds.includes(b.id)} 
                    readOnly
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-800">{b.name}</div>
                    <div className="text-xs text-slate-500">ต.{b.location?.subdistrict} • {b.businessType?.name}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t flex justify-end gap-2 bg-slate-50 rounded-b-2xl">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleAssign}
                disabled={selectedBusinessIds.length === 0 || assigning}
                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {assigning ? "กำลังมอบหมาย..." : "สร้างแผนงาน (Assign)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

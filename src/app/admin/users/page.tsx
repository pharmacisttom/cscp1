"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { Shield, Plus, Building2, User, Key, CheckCircle, Edit, Trash2, AlertTriangle } from "lucide-react";

export default function AdminUsersPage() {
  const { user, isProvinceAdmin } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Action states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    district: "บ้านค่าย",
  });

  const districts = [
    "เมืองระยอง", "บ้านค่าย", "บ้านฉาง", "แกลง", 
    "วังจันทร์", "เขาชะเมา", "นิคมพัฒนา", "ปลวกแดง"
  ];

  useEffect(() => {
    if (user && !isProvinceAdmin) {
      router.push("/");
    }
  }, [user, isProvinceAdmin, router]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isProvinceAdmin) {
      loadUsers();
    }
  }, [isProvinceAdmin]);

  const handleOpenCreate = () => {
    setEditingUserId(null);
    setForm({ email: "", password: "", firstName: "", lastName: "", district: "บ้านค่าย" });
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const handleOpenEdit = (u: any) => {
    setEditingUserId(u.id);
    const names = u.displayName.split(" ");
    const fName = names[0] || "";
    const lName = names.slice(1).join(" ") || "";
    
    setForm({ 
      email: u.email, 
      password: "", 
      firstName: fName, 
      lastName: lName, 
      district: u.district === "ALL" || u.district === "N/A" ? "เมืองระยอง" : u.district 
    });
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const isEdit = !!editingUserId;
      const url = isEdit ? `/api/admin/users/${editingUserId}` : "/api/admin/users";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(isEdit ? "บันทึกการแก้ไขสำเร็จ!" : "สร้างบัญชีผู้ดูแลอำเภอสำเร็จ!");
        loadUsers();
        setTimeout(() => {
          setShowModal(false);
          setSuccess("");
        }, 1500);
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (e) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/users/${deleteUserId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        loadUsers();
        setShowDeleteConfirm(false);
        setDeleteUserId(null);
      } else {
        setError(data.error || "ลบผู้ใช้งานไม่สำเร็จ");
      }
    } catch (e) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isProvinceAdmin) return null;

  return (
    <div className="flex-1 p-6 bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-6 w-6 text-teal-600" />
              จัดการสิทธิ์ผู้ดูแลระบบ (Admin Provisioning)
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              เพิ่ม, แก้ไข และลบบัญชีผู้ใช้งานสำหรับผู้ดูแลระดับอำเภอ (District Admin)
            </p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-teal-700 transition"
          >
            <Plus className="h-4 w-4" />
            เพิ่มสิทธิ์อำเภอใหม่
          </button>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Username / Email</th>
                  <th className="px-6 py-4">ชื่อ - นามสกุล</th>
                  <th className="px-6 py-4">อำเภอที่ดูแล</th>
                  <th className="px-6 py-4">สิทธิ์ (Role)</th>
                  <th className="px-6 py-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      ไม่พบข้อมูลผู้ดูแลระบบ
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-900">{u.email}</td>
                      <td className="px-6 py-4 text-slate-600">{u.displayName}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                          u.district === "ALL" || u.district === "N/A" 
                            ? "bg-purple-100 text-purple-700"
                            : "bg-teal-100 text-teal-700"
                        }`}>
                          <Building2 className="h-3.5 w-3.5" />
                          {u.district === "ALL" ? "สสจ. ระยอง (ทุกอำเภอ)" : `สสอ. ${u.district}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-mono">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.id !== user?.userId ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="text-amber-600 bg-amber-50 hover:bg-amber-100 p-1.5 rounded transition"
                              title="แก้ไขข้อมูล"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteUserId(u.id);
                                setShowDeleteConfirm(true);
                              }}
                              className="text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded transition"
                              title="ลบบัญชีผู้ใช้"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 block text-center">คุณกำลังใช้งาน</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className={`${editingUserId ? 'bg-amber-500' : 'bg-teal-600'} p-5 text-white flex justify-between items-center`}>
              <h2 className="font-bold text-lg">
                {editingUserId ? "แก้ไขผู้ดูแลระดับอำเภอ" : "เพิ่มผู้ดูแลระดับอำเภอ"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
              {success && <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="h-4 w-4"/>{success}</div>}
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">อำเภอที่รับผิดชอบ</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-teal-500 focus:border-teal-500 bg-slate-50"
                  value={form.district}
                  onChange={e => setForm({...form, district: e.target.value})}
                  required
                >
                  {districts.map(d => <option key={d} value={d}>สสอ. {d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username หรือ Email สำหรับล็อกอิน</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    required={!editingUserId}
                    disabled={!!editingUserId}
                    className="w-full pl-9 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="เช่น bankhai_admin"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่าน (Password) {editingUserId && <span className="font-normal text-slate-400">(เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)</span>}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="password" 
                    required={!editingUserId}
                    className="w-full pl-9 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-teal-500 focus:border-teal-500"
                    placeholder={editingUserId ? "••••••••" : "ตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร"}
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อ</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-teal-500 focus:border-teal-500"
                    placeholder="ชื่อจริง"
                    value={form.firstName}
                    onChange={e => setForm({...form, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">นามสกุล</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-teal-500 focus:border-teal-500"
                    placeholder="นามสกุล"
                    value={form.lastName}
                    onChange={e => setForm({...form, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 text-sm font-semibold hover:bg-slate-100 rounded-lg">
                  ยกเลิก
                </button>
                <button type="submit" disabled={submitting} className={`px-4 py-2 ${editingUserId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-teal-600 hover:bg-teal-700'} text-white text-sm font-bold rounded-lg shadow disabled:opacity-70 flex items-center gap-2`}>
                  {submitting ? "กำลังบันทึก..." : (editingUserId ? "บันทึกการแก้ไข" : "ยืนยันการเพิ่มสิทธิ์")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-7 w-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">ยืนยันการลบบัญชี</h3>
            <p className="text-sm text-slate-500 mb-6">
              คุณต้องการลบบัญชีผู้ใช้งานนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถเรียกคืนได้
            </p>
            
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

            <div className="flex justify-center gap-3">
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteUserId(null);
                  setError("");
                }} 
                className="px-4 py-2 text-slate-600 bg-slate-100 text-sm font-bold hover:bg-slate-200 rounded-lg flex-1"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleDelete}
                disabled={submitting} 
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg shadow hover:bg-red-700 disabled:opacity-70 flex-1 flex justify-center items-center"
              >
                {submitting ? "กำลังลบ..." : "ลบผู้ใช้งาน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

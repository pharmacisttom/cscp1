"use client";

import { useState } from "react";
import { Lock, Unlock, Eye, EyeOff, Loader2, ShieldAlert, X } from "lucide-react";

interface ConfidentialModalProps {
  inspectionId: string;
  businessName: string;
  inspectionDate: string;
  currentState: boolean; // true = currently sealed
  onClose: () => void;
  onSuccess: (newState: boolean) => void;
}

export function ConfidentialModal({
  inspectionId,
  businessName,
  inspectionDate,
  currentState,
  onClose,
  onSuccess,
}: ConfidentialModalProps) {
  const action = currentState ? "unseal" : "seal";
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (reason.trim().length < 5) {
      setError("กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร");
      return;
    }
    if (!password) {
      setError("กรุณาระบุรหัสผ่านของคุณเพื่อยืนยัน");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/inspections/${inspectionId}/confidential`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reason.trim(), password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "เกิดข้อผิดพลาด");
      onSuccess(action === "seal");
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการดำเนินการ");
    } finally {
      setLoading(false);
    }
  }

  const isSeal = action === "seal";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between ${isSeal ? "bg-red-600" : "bg-emerald-600"}`}>
          <div className="flex items-center gap-2 text-white">
            {isSeal ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
            <h2 className="text-base font-bold">
              {isSeal ? "ปกปิดบันทึกการตรวจ (ความลับ)" : "เปิดเผยบันทึกการตรวจ"}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info */}
          <div className={`rounded-xl p-3 text-sm ${isSeal ? "bg-red-50 border border-red-200 text-red-800" : "bg-emerald-50 border border-emerald-200 text-emerald-800"}`}>
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold">{businessName}</p>
                <p className="text-xs opacity-80 mt-0.5">
                  วันที่ตรวจ: {new Date(inspectionDate).toLocaleDateString("th-TH")}
                </p>
                <p className="text-xs mt-1.5">
                  {isSeal
                    ? "บันทึกนี้จะถูกซ่อนจากผู้ใช้งานทั่วไป — เข้าถึงได้เฉพาะ Super Admin"
                    : "บันทึกนี้จะกลับมาแสดงให้ผู้ใช้งานทั่วไปเห็นตามปกติ"}
                </p>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              เหตุผล <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isSeal ? "เช่น: บันทึกนี้เกี่ยวข้องกับคดีทางกฎหมายที่อยู่ระหว่างการสอบสวน" : "เช่น: คดีสรุปแล้ว สามารถเปิดเผยได้"}
              rows={3}
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-500 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">ขั้นต่ำ 5 ตัวอักษร</p>
          </div>

          {/* Password confirmation */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              ยืนยันด้วยรหัสผ่านของคุณ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-slate-300 pl-3 pr-10 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-teal-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 ${
                isSeal ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSeal ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              {loading ? "กำลังดำเนินการ..." : isSeal ? "ปกปิดบันทึกนี้" : "เปิดเผยบันทึกนี้"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

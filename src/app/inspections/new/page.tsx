"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardCheck,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Save,
  ArrowLeft,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  ShieldAlert,
  TrendingUp,
  Download,
  Eye,
  Camera,
  Check,
} from "lucide-react";
import { calculateGeoEpiRisk } from "@/lib/risk/engine";

interface UploadedAttachment {
  fileUrl: string;
  fileName: string;
  fileType: "PDF" | "IMAGE" | "DOCUMENT";
  fileSize: number;
  caption?: string;
}

function InspectionFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const businessId = searchParams ? searchParams.get("businessId") : null;

  const [business, setBusiness] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [inspectorName, setInspectorName] = useState("พนักงานเจ้าหน้าที่ สสอ.ปลวกแดง");
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [inspectionType, setInspectionType] = useState("ROUTINE");
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [problemFound, setProblemFound] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [nextFollowupDate, setNextFollowupDate] = useState("");

  // Attachments State
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Default Assessment Questions
  const defaultQuestions = [
    {
      id: "q1",
      section: "หมวดที่ 1: ความถูกต้องของใบอนุญาต",
      text: "มีใบอนุญาตประกอบกิจการถูกต้องและแสดงไว้ในที่เปิดเผย",
      isCritical: true,
      category: "LICENSE",
    },
    {
      id: "q2",
      section: "หมวดที่ 1: ความถูกต้องของใบอนุญาต",
      text: "ผู้ประกอบวิชาชีพ/ผู้ดำเนินการปฏิบัติหน้าที่ตามเวลาที่แจ้ง",
      isCritical: true,
      category: "PHARMACIST_OPERATOR",
    },
    {
      id: "q3",
      section: "หมวดที่ 2: สุขลักษณะและอุปกรณ์",
      text: "สถานที่สะอาด ปราศจากสิ่งปนเปื้อน มีการจัดเก็บแยกเป็นสัดส่วน",
      isCritical: false,
      category: "HYGIENE",
    },
    {
      id: "q4",
      section: "หมวดที่ 2: สุขลักษณะและอุปกรณ์",
      text: "มีการจัดการขยะติดเชื้อหรือขยะอันตรายตามระเบียบสาธารณสุข",
      isCritical: true,
      category: "WASTE_MANAGEMENT",
    },
    {
      id: "q5",
      section: "หมวดที่ 3: คุณภาพผลิตภัณฑ์",
      text: "ไม่พบยา อาหาร หรือผลิตภัณฑ์สุขภาพหมดอายุหรือผิดกฎหมาย",
      isCritical: true,
      category: "PRODUCT_SAFETY",
    },
    {
      id: "q6",
      section: "หมวดที่ 3: คุณภาพผลิตภัณฑ์",
      text: "มีการบันทึกรายงาน อุณหภูมิ และการจัดเก็บเอกสารอย่างถูกต้อง",
      isCritical: false,
      category: "RECORD_KEEPING",
    },
  ];

  useEffect(() => {
    async function loadBusinessData() {
      if (!businessId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/map/business/${businessId}`);
        const json = await res.json();
        if (json.success) {
          setBusiness(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadBusinessData();
  }, [businessId]);

  const toggleAnswer = (questionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === undefined ? false : !prev[questionId],
    }));
  };

  // Dynamic Risk Preview Calculation
  const failedQuestions = defaultQuestions.filter((q) => answers[q.id] === false);
  const hasCriticalFailed = failedQuestions.some((q) => q.isCritical);
  const passedCount = defaultQuestions.length - failedQuestions.length;
  const currentScore = Math.round((passedCount / defaultQuestions.length) * 100);
  const currentResult = hasCriticalFailed || currentScore < 80 ? "FAILED" : "PASSED";

  const previewRisk = calculateGeoEpiRisk({
    businessTypeBaseRisk: business?.baseRisk || 20,
    failedLastInspection: currentResult === "FAILED",
    hasCriticalFinding: hasCriticalFailed,
    complaintLast90Days: (business?.complaints?.length || 0) > 0,
    isOverdueInspection: false,
  });

  // Handle File Uploads (PDF & Images)
  const handleFileUpload = async (files: FileList | null, expectedType: "PDF" | "IMAGE") => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (json.success && json.data) {
        setAttachments((prev) => [...prev, ...json.data]);
      } else {
        alert(json.error || "เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setUploading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const updateAttachmentCaption = (index: number, caption: string) => {
    setAttachments((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, caption } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) {
      alert("กรุณาเลือกสถานประกอบการ");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          inspectionDate,
          inspectionType,
          inspectorName,
          result: currentResult,
          score: currentScore,
          problemFound,
          recommendation,
          nextFollowupDate: currentResult === "FAILED" ? nextFollowupDate : null,
          answers,
          criticalFindings: failedQuestions.map((q) => ({
            category: q.category,
            description: q.text,
            isCritical: q.isCritical,
          })),
          attachments,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert(
          `✅ บันทึกผลการตรวจเรียบร้อยแล้ว!\n\n` +
          `ผลการตรวจ: ${currentResult === "PASSED" ? "ผ่านเกณฑ์" : "ไม่ผ่านเกณฑ์"}\n` +
          `คะแนน: ${currentScore} / 100\n` +
          `ปรับปรุงคะแนนความเสี่ยงใหม่เป็น: ${previewRisk.score} (${previewRisk.level})\n` +
          `แนบเอกสารและรูปภาพ: ${attachments.length} รายการ`
        );
        router.push("/map");
      } else {
        alert(json.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-500 text-xs">
        กำลังโหลดข้อมูลสถานประกอบการ...
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับ
        </button>

        <span className="text-xs text-slate-400">
          ระบบตรวจประเมิน • แนบเอกสาร PDF & ภาพถ่าย
        </span>
      </div>

      {/* Header Info Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-700 mb-1">
              <ClipboardCheck className="h-4 w-4" />
              <span>บันทึกผลการตรวจประเมินสถานประกอบการ</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {business?.name || "สถานประกอบการ"}
            </h1>
            {business && (
              <p className="text-xs text-slate-500 mt-1">
                {business.businessType} • ต.{business.location?.subdistrict} อ.
                {business.location?.district} • ใบอนุญาต:{" "}
                {business.licenses[0]?.licenseNo || "ไม่มีข้อมูล"}
              </p>
            )}
          </div>

          {/* Current Risk Badge */}
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
            <div className="text-right text-xs">
              <span className="text-[10px] text-slate-400 block font-semibold">
                ความเสี่ยงปัจจุบัน
              </span>
              <span className="font-extrabold text-slate-800 text-sm">
                Score {business?.riskScore || 0}
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                business?.riskLevel === "CRITICAL"
                  ? "bg-red-100 text-red-700"
                  : business?.riskLevel === "HIGH"
                  ? "bg-orange-100 text-orange-700"
                  : business?.riskLevel === "MODERATE"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {business?.riskLevel || "LOW"}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Real-Time Risk Impact Preview */}
      <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50/70 to-emerald-50/70 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-600 text-white shadow-sm">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-teal-950 block text-sm">
              ประเมินผลการตรวจ & คาดการณ์ระดับความเสี่ยงใหม่
            </span>
            <span className="text-teal-800">
              ผลการประเมิน: <b>{currentResult === "PASSED" ? "ผ่านเกณฑ์" : "ไม่ผ่านเกณฑ์"}</b> (คะแนน {currentScore}/100)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-teal-200 shadow-sm">
          <div className="text-right text-xs">
            <span className="text-[10px] text-slate-400 block">ระดับความเสี่ยงใหม่หลังตรวจ</span>
            <b className="text-teal-900 text-sm">Risk {previewRisk.score}</b>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
              previewRisk.level === "CRITICAL"
                ? "bg-red-100 text-red-700"
                : previewRisk.level === "HIGH"
                ? "bg-orange-100 text-orange-700"
                : previewRisk.level === "MODERATE"
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {previewRisk.level}
          </span>
        </div>
      </div>

      {/* Main Inspection Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meta Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              วันที่ตรวจประเมิน
            </label>
            <input
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:border-teal-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              ประเภทการตรวจ
            </label>
            <select
              value={inspectionType}
              onChange={(e) => setInspectionType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:border-teal-500 focus:outline-none"
            >
              <option value="ROUTINE">ตรวจเฝ้าระวังประจำปี (Routine)</option>
              <option value="COMPLAINT_BASED">ตรวจตามเรื่องร้องเรียน (Complaint)</option>
              <option value="FOLLOW_UP">ตรวจติดตามผลข้อบกพร่อง (Follow-up)</option>
              <option value="SPECIAL">ตรวจกรณีพิเศษ / บูรณาการ (Special)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              ชื่อผู้ตรวจประเมิน
            </label>
            <input
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:border-teal-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Dynamic Questions Checklist */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-slate-800">
              รายการตรวจประเมินมาตรฐาน (Inspection Checklist)
            </h3>
            <span className="text-xs text-slate-500">
              คลิกเพื่อสลับสถานะ ผ่าน / ไม่ผ่าน
            </span>
          </div>

          <div className="space-y-2">
            {defaultQuestions.map((q) => {
              const isPassed = answers[q.id] !== false; // default passed unless toggled
              return (
                <div
                  key={q.id}
                  onClick={() => toggleAnswer(q.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isPassed
                      ? "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70"
                      : "border-red-200 bg-red-50/50 hover:bg-red-50/80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isPassed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">
                        {q.text}
                      </span>
                      <span className="text-[10px] text-slate-500">{q.section}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {q.isCritical && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                        CRITICAL
                      </span>
                    )}
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        isPassed
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {isPassed ? "ผ่าน" : "ไม่ผ่าน"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attachment Upload Section: PDF & Photos */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Upload className="h-4 w-4 text-teal-600" />
              <span>แนบไฟล์ผลตรวจ: เอกสาร PDF และรูปภาพถ่ายหน้างาน</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              แนบแล้ว {attachments.length} ไฟล์
            </span>
          </div>

          {/* Upload Buttons / Dropzones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* PDF Upload Button */}
            <div
              onClick={() => pdfInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center cursor-pointer hover:border-teal-500 hover:bg-slate-50 transition-all flex flex-col items-center justify-center space-y-1"
            >
              <FileText className="h-8 w-8 text-rose-500 mb-1" />
              <span className="text-xs font-bold text-slate-800">
                อัปโหลดเอกสาร PDF
              </span>
              <p className="text-[11px] text-slate-400">
                เช่น รายงานผลแล็บ, ใบตรวจประเมินทางการ, คำสั่งแก้ไข
              </p>
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files, "PDF")}
              />
            </div>

            {/* Photo Upload / Camera Button */}
            <div
              onClick={() => photoInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center cursor-pointer hover:border-teal-500 hover:bg-slate-50 transition-all flex flex-col items-center justify-center space-y-1"
            >
              <Camera className="h-8 w-8 text-teal-600 mb-1" />
              <span className="text-xs font-bold text-slate-800">
                ถ่ายภาพ / แนบรูปภาพผลตรวจ
              </span>
              <p className="text-[11px] text-slate-400">
                ภาพถ่ายสภาพสถานที่, ข้อบกพร่อง, ป้ายใบอนุญาต, อุปกรณ์
              </p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files, "IMAGE")}
              />
            </div>
          </div>

          {uploading && (
            <div className="text-xs text-center text-teal-600 font-semibold animate-pulse py-2">
              กำลังอัปโหลดไฟล์ไปยังระบบจัดเก็บข้อมูล...
            </div>
          )}

          {/* Attached Files List */}
          {attachments.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 block">
                ไฟล์ที่แนบไว้ในครั้งนี้:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {att.fileType === "PDF" ? (
                        <FileText className="h-6 w-6 text-rose-500 shrink-0" />
                      ) : (
                        <img
                          src={att.fileUrl}
                          alt={att.fileName}
                          className="h-9 w-9 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      )}
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 truncate block">
                          {att.fileName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {att.fileType} • {(att.fileSize / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-500 hover:text-teal-600 rounded-lg hover:bg-white"
                        title="เปิดดูไฟล์"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white"
                        title="ลบไฟล์"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Findings, Orders & Follow-up */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              ข้อบกพร่องที่ตรวจพบ (Findings & Violations)
            </label>
            <textarea
              rows={3}
              value={problemFound}
              onChange={(e) => setProblemFound(e.target.value)}
              placeholder="ระบุรายละเอียดข้อบกพร่อง หรือความไม่ผ่านมาตรฐานที่ตรวจพบในครั้งนี้..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              ข้อเสนอแนะและคำสั่งให้ดำเนินการแก้ไข (Corrective Actions & Orders)
            </label>
            <textarea
              rows={3}
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              placeholder="ระบุคำสั่งแก้ไข ระยะเวลา และแนวทางปฏิบัติที่ผู้ประกอบการต้องปรับปรุง..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {currentResult === "FAILED" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>การตรวจไม่ผ่านเกณฑ์: กรุณากำหนดวันลงตรวจติดตามผล (Follow-up Date)</span>
              </div>
              <input
                type="date"
                value={nextFollowupDate}
                onChange={(e) => setNextFollowupDate(e.target.value)}
                className="w-full sm:w-64 rounded-xl border border-red-300 p-2 text-slate-800 bg-white"
                required={currentResult === "FAILED"}
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Save className="h-5 w-5" />
          {submitting
            ? "กำลังบันทึกและปรับปรุงระดับความเสี่ยง..."
            : "บันทึกผลการตรวจ อัปโหลดเอกสาร/ภาพถ่าย และปรับปรุงความเสี่ยง"}
        </button>
      </form>
    </div>
  );
}

export default function NewInspectionPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500">
          กำลังเตรียมแบบบันทึกผลตรวจ...
        </div>
      }
    >
      <InspectionFormContent />
    </Suspense>
  );
}

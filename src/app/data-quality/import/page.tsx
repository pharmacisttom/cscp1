"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import Papa from "papaparse";

export default function ImportPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResults(null);
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith(".csv")) {
        setError("กรุณาอัปโหลดไฟล์ CSV เท่านั้น");
        return;
      }
      setFile(selectedFile);
      
      // Preview parsing
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setPreviewData(results.data.slice(0, 5)); // Preview first 5 rows
        }
      });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    try {
      // Parse entire file
      const parsed = await new Promise<any[]>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data),
          error: (error) => reject(error),
        });
      });

      // Send to server
      const res = await fetch("/api/import/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsed, fileName: file.name }),
      });

      const data = await res.json();
      if (data.success) {
        setResults(data.summary);
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
      }
    } catch (err: any) {
      console.error(err);
      setError("ไม่สามารถอ่านไฟล์หรือเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 p-6 bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Breadcrumb & Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center text-sm text-slate-500 font-medium">
            <Link href="/data-quality" className="hover:text-teal-600">คุณภาพข้อมูล</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="text-slate-900">นำเข้าข้อมูลสถานประกอบการ</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Upload className="h-6 w-6 text-teal-600" />
              นำเข้าข้อมูลสถานประกอบการ (Import)
            </h1>
            <a 
              href="/api/import/template"
              download
              className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-slate-50 transition"
            >
              <Download className="h-4 w-4" />
              ดาวน์โหลด Template (CSV)
            </a>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <FileSpreadsheet className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">อัปโหลดไฟล์ CSV</h3>
          <p className="text-slate-500 text-sm mb-6">
            รองรับเฉพาะไฟล์ .csv ที่มีหัวคอลัมน์ตรงตาม Template เท่านั้น<br/>
            {user?.district !== "ALL" && (
              <span className="text-amber-600 font-medium">
                คุณสามารถนำเข้าข้อมูลได้เฉพาะในพื้นที่อำเภอ {user?.district} เท่านั้น
              </span>
            )}
          </p>
          
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange} 
            className="hidden" 
            id="file-upload"
          />
          <label 
            htmlFor="file-upload" 
            className="cursor-pointer bg-teal-600 text-white px-6 py-2.5 rounded-lg font-bold shadow hover:bg-teal-700 transition inline-block"
          >
            เลือกไฟล์จากเครื่อง
          </label>
          
          {file && (
            <div className="mt-4 text-sm font-medium text-teal-700 bg-teal-50 inline-block px-4 py-2 rounded-full border border-teal-100">
              ไฟล์ที่เลือก: {file.name}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">เกิดข้อผิดพลาด</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Preview */}
        {previewData.length > 0 && !results && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">ตัวอย่างข้อมูล (5 แถวแรก)</h3>
              <button 
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-teal-600 text-white px-4 py-1.5 rounded-lg font-semibold text-sm shadow hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading ? "กำลังนำเข้าข้อมูล..." : "ยืนยันการนำเข้าข้อมูล"}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-4 py-2">ชื่อสถานประกอบการ</th>
                    <th className="px-4 py-2">รหัส/ใบอนุญาต</th>
                    <th className="px-4 py-2">ตำบล</th>
                    <th className="px-4 py-2">อำเภอ</th>
                    <th className="px-4 py-2">พิกัด GPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2">{row["ชื่อสถานประกอบการ"]}</td>
                      <td className="px-4 py-2">{row["รหัส/เลขที่ใบอนุญาต"]}</td>
                      <td className="px-4 py-2">{row["ตำบล"]}</td>
                      <td className="px-4 py-2">{row["อำเภอ"]}</td>
                      <td className="px-4 py-2">{row["พิกัด GPS"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-100 p-2 rounded-full">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">สรุปผลการนำเข้าข้อมูล</h3>
                <p className="text-slate-500 text-sm">ตรวจสอบรายละเอียดการนำเข้าด้านล่าง</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="text-slate-500 text-xs font-bold mb-1">จำนวนทั้งหมด</div>
                <div className="text-2xl font-black text-slate-800">{results.totalRows}</div>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                <div className="text-emerald-700 text-xs font-bold mb-1">นำเข้าสำเร็จ</div>
                <div className="text-2xl font-black text-emerald-600">{results.successRows}</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <div className="text-amber-700 text-xs font-bold mb-1">ข้าม (ข้อมูลซ้ำ)</div>
                <div className="text-2xl font-black text-amber-600">{results.skippedRows}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <div className="text-red-700 text-xs font-bold mb-1">ล้มเหลว (ข้อมูลผิดพลาด)</div>
                <div className="text-2xl font-black text-red-600">{results.failedRows}</div>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  รายการที่พบปัญหา
                </h4>
                <div className="max-h-48 overflow-y-auto bg-slate-50 rounded-lg p-3 text-sm font-mono border border-slate-200">
                  {results.errors.map((e: any, i: number) => (
                    <div key={i} className="text-slate-600 py-1 border-b border-slate-200 last:border-0">
                      <span className="font-bold text-slate-800">แถวที่ {e.row}:</span> {e.reason} ({e.name})
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <button 
                onClick={() => {
                  setFile(null);
                  setPreviewData([]);
                  setResults(null);
                }}
                className="bg-slate-100 text-slate-700 px-6 py-2 rounded-lg font-semibold hover:bg-slate-200 transition"
              >
                นำเข้าข้อมูลเพิ่ม
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

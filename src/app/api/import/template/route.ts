import { NextResponse } from "next/server";

export async function GET() {
  // Define standard columns in Thai
  const headers = [
    "ชื่อสถานประกอบการ",         // 1
    "รหัส/เลขที่ใบอนุญาต",        // 2
    "ประเภทสถานประกอบการ",        // 3 (e.g. CLINIC, PHARMACY)
    "บ้านเลขที่/หมู่ที่",          // 4
    "ตำบล",                    // 5
    "อำเภอ",                   // 6
    "พิกัด GPS",                // 7 (e.g. 12.969,101.219)
    "เบอร์โทรศัพท์",              // 8
    "เวลาเปิดทำการ",              // 9
    "ปีที่หมดอายุ (พ.ศ.)",         // 10
    "ชื่อผู้รับอนุญาต",             // 11
    "ชื่อผู้ดำเนินการ"              // 12
  ];

  // Provide an example row based on clinicpdh.xlsx
  const exampleRow = [
    "บุญประทานคลินิกเวชกรรม (สยามอีสเทิร์น)",
    "21101001257",
    "CLINIC",
    "898/4-5 ม.3",
    "มาบยางพร",
    "ปลวกแดง",
    '"12.969603, 101.219151"', // Use quotes since it contains a comma
    "09 5715 4101",
    "ทุกวัน เวลา 09.00-21.00 น.",
    "2576",
    "นางสาวกษิรมาต มูลคำ",
    "นางยุพาวรรณ ตระกูลรัมย์"
  ];

  const csvContent = "\uFEFF" + headers.join(",") + "\n" + exampleRow.join(",");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cscp_import_template.csv"',
    },
  });
}

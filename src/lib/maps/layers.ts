export interface MapLayerConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  iconName: string;
  defaultVisible: boolean;
  order: number;
}

export const MAP_LAYERS: MapLayerConfig[] = [
  {
    id: "all_businesses",
    name: "สถานประกอบการทั้งหมด",
    description: "แสดงตำแหน่งสถานประกอบการด้านผลิตภัณฑ์สุขภาพทั้งหมด",
    color: "#3b82f6",
    iconName: "Building2",
    defaultVisible: true,
    order: 1,
  },
  {
    id: "risk_level",
    name: "ระดับความเสี่ยง (Risk Level)",
    description: "จำแนกสีตามระดับความเสี่ยง (เขียว/เหลือง/ส้ม/แดง)",
    color: "#ef4444",
    iconName: "ShieldAlert",
    defaultVisible: true,
    order: 2,
  },
  {
    id: "inspection_status",
    name: "สถานะการตรวจประเมิน",
    description: "ตรวจแล้ว / อยู่ในแผน / ยังไม่ได้ตรวจ",
    color: "#10b981",
    iconName: "ClipboardCheck",
    defaultVisible: false,
    order: 3,
  },
  {
    id: "license_expiry",
    name: "ใบอนุญาตหมดอายุ / ใกล้หมดอายุ",
    description: "สถานประกอบการที่ใบอนุญาตหมดอายุหรือใกล้หมดอายุภายใน 90 วัน",
    color: "#f59e0b",
    iconName: "Clock",
    defaultVisible: false,
    order: 4,
  },
  {
    id: "complaints",
    name: "เรื่องร้องเรียน (Complaint / Urgent)",
    description: "สถานประกอบการที่มีเรื่องร้องเรียนที่ยังไม่ยุติหรือมีประเด็นเร่งด่วน",
    color: "#8b5cf6",
    iconName: "AlertTriangle",
    defaultVisible: false,
    order: 5,
  },
  {
    id: "overdue_inspection",
    name: "เกินกำหนดตรวจ (Overdue Inspection)",
    description: "เลยกำหนดรอบการตรวจประเมินประจำปี",
    color: "#ea580c",
    iconName: "CalendarX",
    defaultVisible: false,
    order: 6,
  },
  {
    id: "followup_required",
    name: "ต้องติดตามผล (Follow-up Required)",
    description: "พบข้อบกพร่องที่ต้องลงตรวจซ้ำเพื่อยืนยันการแก้ไข",
    color: "#06b6d4",
    iconName: "Repeat",
    defaultVisible: false,
    order: 7,
  },
  {
    id: "hotspots",
    name: "จุดเสี่ยงหนาแน่น (Spatial Hotspot)",
    description: "พื้นที่ที่มีการกระจุกตัวของความเสี่ยงสูงหรือคำร้องเรียน (DBSCAN)",
    color: "#dc2626",
    iconName: "Flame",
    defaultVisible: true,
    order: 8,
  },
  {
    id: "inspection_coverage",
    name: "ความครอบคลุมการตรวจ (Coverage Grid)",
    description: "แสดงพื้นที่ที่ได้รับการตรวจครอบคลุมตามเป้าหมาย",
    color: "#14b8a6",
    iconName: "PieChart",
    defaultVisible: false,
    order: 9,
  },
  {
    id: "data_quality",
    name: "คุณภาพข้อมูล (Data Quality Warning)",
    description: "ไม่มีพิกัด GPS, พิกัดไม่สมบูรณ์ หรือขาดข้อมูลใบอนุญาต",
    color: "#6b7280",
    iconName: "HelpCircle",
    defaultVisible: false,
    order: 10,
  },
  {
    id: "province_boundary",
    name: "1. ขอบเขตจังหวัดระยอง (Rayong Province)",
    description: "เส้นขอบเขตการปกครองทั้งจังหวัดระยอง",
    color: "#1e3a8a",
    iconName: "Map",
    defaultVisible: true,
    order: 10,
  },
  {
    id: "district_boundary",
    name: "2. ขอบเขตแต่ละอำเภอ (8 อำเภอ จ.ระยอง)",
    description: "เส้นแบ่ง 8 อำเภอ: ปลวกแดง, เมืองระยอง, บ้านฉาง, แกลง, วังจันทร์, บ้านค่าย, เขาชะเมา, นิคมพัฒนา",
    color: "#4f46e5",
    iconName: "Building2",
    defaultVisible: true,
    order: 11,
  },
  {
    id: "subdistrict_boundary",
    name: "3. ขอบเขตแต่ละตำบล (อ.ปลวกแดง)",
    description: "เส้นแบ่ง 6 ตำบล: ปลวกแดง, ตาสิทธิ์, ละหาร, แม่น้ำคู้, มาบยางพร, หนองไร่",
    color: "#0d9488",
    iconName: "MapPin",
    defaultVisible: true,
    order: 12,
  },
  {
    id: "inspection_route",
    name: "เส้นทางออกตรวจ (Daily Route)",
    description: "เส้นทางลำดับจุดตรวจประจำวันตามการคำนวณ GSIE",
    color: "#0284c7",
    iconName: "Navigation",
    defaultVisible: true,
    order: 13,
  },
];

export const RISK_PALETTE = {
  LOW: {
    label: "เสี่ยงต่ำ (Low)",
    color: "#10b981", // Green
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: "ShieldCheck",
  },
  MODERATE: {
    label: "เสี่ยงปานกลาง (Moderate)",
    color: "#f59e0b", // Yellow/Amber
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: "Info",
  },
  HIGH: {
    label: "เสี่ยงสูง (High)",
    color: "#f97316", // Orange
    badgeClass: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    icon: "AlertTriangle",
  },
  CRITICAL: {
    label: "วิกฤต (Critical)",
    color: "#ef4444", // Red
    badgeClass: "bg-red-500/10 text-red-600 border-red-500/20",
    icon: "AlertOctagon",
  },
  COMPLAINT: {
    label: "มีเรื่องร้องเรียน (Complaint)",
    color: "#8b5cf6", // Purple
    badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    icon: "BellRing",
  },
  UNKNOWN: {
    label: "ไม่ทราบ / ข้อมูลไม่พร้อม",
    color: "#9ca3af", // Gray
    badgeClass: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    icon: "HelpCircle",
  },
};

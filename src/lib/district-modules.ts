export const RAYONG_DISTRICTS = [
  "เมืองระยอง",
  "แกลง",
  "บ้านค่าย",
  "ปลวกแดง",
  "บ้านฉาง",
  "วังจันทร์",
  "เขาชะเมา",
  "นิคมพัฒนา",
] as const;

export const DISTRICT_MODULES = [
  "smartPlans",
  "inspections",
  "dataQuality",
  "kpis",
  "systemManagement",
] as const;

export type DistrictModule = (typeof DISTRICT_MODULES)[number];
export type DistrictModuleAccess = Record<DistrictModule, boolean>;
export type DistrictAccessMatrix = Record<string, DistrictModuleAccess>;

export const DISTRICT_MODULE_LABELS: Record<DistrictModule, string> = {
  smartPlans: "แผนตรวจอัจฉริยะ",
  inspections: "ผลการตรวจและ Field GPS",
  dataQuality: "คุณภาพข้อมูล",
  kpis: "เป้าหมายและ KPI",
  systemManagement: "จัดการระบบอำเภอ",
};

export function defaultModuleAccess(): DistrictModuleAccess {
  return {
    smartPlans: true,
    inspections: true,
    dataQuality: true,
    kpis: true,
    systemManagement: true,
  };
}

export function defaultDistrictAccessMatrix(): DistrictAccessMatrix {
  return Object.fromEntries(
    RAYONG_DISTRICTS.map((district) => [district, defaultModuleAccess()]),
  );
}

export function normalizeDistrictAccess(value: unknown): DistrictAccessMatrix {
  const stored = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(
    RAYONG_DISTRICTS.map((district) => {
      const row = stored[district] && typeof stored[district] === "object"
        ? stored[district] as Record<string, unknown>
        : {};
      return [district, Object.fromEntries(
        DISTRICT_MODULES.map((module) => [module, row[module] !== false]),
      ) as DistrictModuleAccess];
    }),
  );
}

import { prisma } from "@/lib/prisma";
import {
  defaultModuleAccess,
  normalizeDistrictAccess,
  type DistrictAccessMatrix,
  type DistrictModule,
  type DistrictModuleAccess,
} from "@/lib/district-modules";
import { isAdmin } from "@/lib/rbac";

const SETTING_SCOPE = "RAYONG_PROVINCE";
const SETTING_KEY = "district_inspection_modules";

export async function getDistrictAccessMatrix(): Promise<DistrictAccessMatrix> {
  const setting = await prisma.systemSetting.findUnique({
    where: { scope_key: { scope: SETTING_SCOPE, key: SETTING_KEY } },
  });
  return normalizeDistrictAccess(setting?.value);
}

export async function saveDistrictAccessMatrix(matrix: DistrictAccessMatrix) {
  const normalized = normalizeDistrictAccess(matrix);
  return prisma.systemSetting.upsert({
    where: { scope_key: { scope: SETTING_SCOPE, key: SETTING_KEY } },
    update: { value: normalized },
    create: {
      scope: SETTING_SCOPE,
      key: SETTING_KEY,
      value: normalized,
    },
  });
}

export async function getModuleAccessForUser(
  role?: string | null,
  district?: string | null,
): Promise<DistrictModuleAccess> {
  if (isAdmin(role)) return defaultModuleAccess();
  if (!district || district === "ALL") return defaultModuleAccess();
  const matrix = await getDistrictAccessMatrix();
  return matrix[district] ?? defaultModuleAccess();
}

export async function canUseDistrictModule(
  role: string | null,
  district: string | null,
  module: DistrictModule,
): Promise<boolean> {
  if (isAdmin(role)) return true;
  const access = await getModuleAccessForUser(role, district);
  return access[module];
}

export async function canUseDistrictModuleFromHeaders(
  headers: Headers,
  module: DistrictModule,
): Promise<boolean> {
  const role = headers.get("x-user-role");
  const encodedDistrict = headers.get("x-user-district");
  let district = encodedDistrict;
  try {
    district = encodedDistrict ? decodeURIComponent(encodedDistrict) : null;
  } catch {
    district = encodedDistrict;
  }
  return canUseDistrictModule(role, district, module);
}

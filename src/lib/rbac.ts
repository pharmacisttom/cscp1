export type AppRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "DISTRICT_MANAGER"
  | "INSPECTOR"
  | "ANALYST"
  | "VIEWER";

/**
 * Super Admins have full system access
 */
export function isSuperAdmin(role?: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "PROVINCE_ADMIN";
}

/**
 * Admins have organizational administrative access (includes SUPER_ADMIN)
 */
export function isAdmin(role?: string | null): boolean {
  return isSuperAdmin(role) || role === "ADMIN";
}

/**
 * District Managers manage district operations (Admins inherit this)
 */
export function isDistrictManager(role?: string | null): boolean {
  return isAdmin(role) || role === "DISTRICT_MANAGER" || role === "DISTRICT_ADMIN";
}

/**
 * Inspectors are operational field staff.
 * Note: Inspectors DO NOT automatically inherit District Manager privileges.
 */
export function isInspector(role?: string | null): boolean {
  return role === "INSPECTOR" || role === "INSPECTOR_FIELD";
}

/**
 * Analysts have reporting and analytics access. (Admins inherit this)
 */
export function isAnalyst(role?: string | null): boolean {
  return isAdmin(role) || role === "ANALYST";
}

/**
 * Can manage users/roles (Admin only)
 */
export function canManageUsers(role?: string | null): boolean {
  return isAdmin(role);
}

/**
 * Can manage district-level operations like plans, businesses (District Manager or above)
 */
export function canManageDistrict(role?: string | null): boolean {
  return isDistrictManager(role);
}

/**
 * Can perform field inspections (Inspector, District Manager, Admin)
 */
export function canInspect(role?: string | null): boolean {
  return isInspector(role) || isDistrictManager(role);
}

/**
 * Can analyze and view reports (Analyst, Admin, District Manager)
 */
export function canAnalyze(role?: string | null): boolean {
  return isAnalyst(role) || isDistrictManager(role);
}

/**
 * Can view data (Everyone with a role)
 */
export function canView(role?: string | null): boolean {
  return !!role; // Any valid authenticated role
}

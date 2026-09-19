import {
  isSuperAdmin,
  isAdmin,
  isDistrictManager,
  isInspector,
  isAnalyst,
  canManageUsers,
  canManageDistrict,
  canInspect,
  canAnalyze,
  canView,
} from "../src/lib/rbac";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("Running RBAC logic tests...");

// 1. SUPER_ADMIN
assert(isSuperAdmin("SUPER_ADMIN"), "SUPER_ADMIN should be super admin");
assert(isAdmin("SUPER_ADMIN"), "SUPER_ADMIN should be admin");
assert(isDistrictManager("SUPER_ADMIN"), "SUPER_ADMIN should be district manager");
assert(canManageUsers("SUPER_ADMIN"), "SUPER_ADMIN can manage users");
assert(canManageDistrict("SUPER_ADMIN"), "SUPER_ADMIN can manage district");
assert(canAnalyze("SUPER_ADMIN"), "SUPER_ADMIN can analyze");

// 2. ADMIN
assert(!isSuperAdmin("ADMIN"), "ADMIN is not super admin");
assert(isAdmin("ADMIN"), "ADMIN should be admin");
assert(canManageUsers("ADMIN"), "ADMIN can manage users");
assert(canManageDistrict("ADMIN"), "ADMIN can manage district");

// 3. DISTRICT_MANAGER
assert(!isAdmin("DISTRICT_MANAGER"), "DISTRICT_MANAGER is not admin");
assert(isDistrictManager("DISTRICT_MANAGER"), "DISTRICT_MANAGER should be district manager");
assert(!canManageUsers("DISTRICT_MANAGER"), "DISTRICT_MANAGER cannot manage users");
assert(canManageDistrict("DISTRICT_MANAGER"), "DISTRICT_MANAGER can manage district");
assert(canInspect("DISTRICT_MANAGER"), "DISTRICT_MANAGER can inspect");

// 4. INSPECTOR
assert(!isDistrictManager("INSPECTOR"), "INSPECTOR is not district manager");
assert(isInspector("INSPECTOR"), "INSPECTOR is inspector");
assert(canInspect("INSPECTOR"), "INSPECTOR can inspect");
assert(!canManageDistrict("INSPECTOR"), "INSPECTOR cannot manage district");
assert(!canManageUsers("INSPECTOR"), "INSPECTOR cannot manage users");

// 5. ANALYST
assert(isAnalyst("ANALYST"), "ANALYST is analyst");
assert(canAnalyze("ANALYST"), "ANALYST can analyze");
assert(!canManageUsers("ANALYST"), "ANALYST cannot manage users");

// 6. VIEWER
assert(canView("VIEWER"), "VIEWER can view");
assert(!canManageUsers("VIEWER"), "VIEWER cannot manage users");
assert(!canInspect("VIEWER"), "VIEWER cannot inspect");

console.log("RBAC logic tests passed successfully!");

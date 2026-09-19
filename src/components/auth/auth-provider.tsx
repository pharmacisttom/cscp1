"use client";

import React, { createContext, useContext, ReactNode } from "react";
import type { UserSessionPayload } from "@/lib/jwt";
import { defaultModuleAccess, type DistrictModuleAccess } from "@/lib/district-modules";
import { 
  isAdmin, 
  isDistrictManager, 
  isSuperAdmin, 
  isInspector, 
  isAnalyst, 
  canView 
} from "@/lib/rbac";

interface AuthContextType {
  user: UserSessionPayload | null;
  // Legacy support (to be phased out where appropriate)
  isProvinceAdmin: boolean;
  isDistrictAdmin: boolean;
  // Canonical helpers
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isDistrictManager: boolean;
  isInspector: boolean;
  isAnalyst: boolean;
  moduleAccess: DistrictModuleAccess;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isProvinceAdmin: false,
  isDistrictAdmin: false,
  isSuperAdmin: false,
  isAdmin: false,
  isDistrictManager: false,
  isInspector: false,
  isAnalyst: false,
  moduleAccess: defaultModuleAccess(),
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({
  children,
  user,
  moduleAccess = defaultModuleAccess(),
}: {
  children: ReactNode;
  user: UserSessionPayload | null;
  moduleAccess?: DistrictModuleAccess;
}) {
  const role = user?.role;
  
  // Legacy compatibility mappings
  const isProvinceAdminLegacy = isAdmin(role);
  const isDistrictAdminLegacy = isDistrictManager(role);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isProvinceAdmin: isProvinceAdminLegacy, 
      isDistrictAdmin: isDistrictAdminLegacy,
      isSuperAdmin: isSuperAdmin(role),
      isAdmin: isAdmin(role),
      isDistrictManager: isDistrictManager(role),
      isInspector: isInspector(role),
      isAnalyst: isAnalyst(role),
      moduleAccess,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

"use client";

import React, { createContext, useContext, ReactNode } from "react";
import type { UserSessionPayload } from "@/lib/jwt";

interface AuthContextType {
  user: UserSessionPayload | null;
  isProvinceAdmin: boolean;
  isDistrictAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isProvinceAdmin: false,
  isDistrictAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({
  children,
  user,
}: {
  children: ReactNode;
  user: UserSessionPayload | null;
}) {
  const isProvinceAdmin = user?.role === "PROVINCE_ADMIN";
  const isDistrictAdmin = user?.role === "DISTRICT_ADMIN" || user?.role === "INSPECTOR";

  return (
    <AuthContext.Provider value={{ user, isProvinceAdmin, isDistrictAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

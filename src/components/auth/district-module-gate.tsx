"use client";

import type { ReactNode } from "react";
import { ShieldX } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { DISTRICT_MODULE_LABELS, type DistrictModule } from "@/lib/district-modules";

export function DistrictModuleGate({
  module,
  children,
}: {
  module: DistrictModule;
  children: ReactNode;
}) {
  const { moduleAccess } = useAuth();
  if (moduleAccess[module]) return <>{children}</>;

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <ShieldX className="mx-auto h-12 w-12 text-amber-600" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">โมดูลนี้ยังไม่เปิดใช้งาน</h1>
        <p className="mt-2 text-sm text-slate-600">
          สสจ.ระยองยังไม่ได้เปิด “{DISTRICT_MODULE_LABELS[module]}” สำหรับอำเภอของบัญชีนี้
          กรุณาติดต่อผู้ดูแลระบบระดับจังหวัด
        </p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useState } from "react";
import {
  Activity,
  Map,
  ShieldCheck,
  Navigation as NavigationIcon,
  Smartphone,
  ClipboardCheck,
  Database,
  Settings,
  Menu,
  X,
  Target,
  Users
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const { isProvinceAdmin, user } = useAuth();
  const hasProvinceScope = isProvinceAdmin || user?.district === "ALL";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Main 4 items for the bottom bar
  const mainItems = [
    { href: "/", label: "หน้าแรก", icon: Activity },
    { href: "/map", label: "แผนที่", icon: Map },
    { href: "/inspections/field", label: "ลงพื้นที่", icon: Smartphone },
    { href: "/plans/smart", label: "แผนตรวจ", icon: NavigationIcon },
  ];

  // All items for the "More" menu
  const allItems = [
    { href: "/workspace", label: "พื้นที่ทำงาน", icon: Activity },
    { href: "/", label: "ศูนย์บัญชาการ", icon: Activity },
    { href: "/map", label: "Smart Map", icon: Map },
    { href: "/surveillance", label: "เฝ้าระวังระบาดวิทยา", icon: ShieldCheck },
    { href: "/plans/smart", label: "แผนตรวจอัจฉริยะ", icon: NavigationIcon },
    { href: "/inspections", label: "ผลการตรวจ & PDF", icon: ClipboardCheck },
    { href: "/inspections/field", label: "Field GPS", icon: Smartphone },
    { href: "/data-quality", label: "คุณภาพข้อมูล", icon: Database },
  ];

  if (hasProvinceScope) {
    allItems.push({ href: "/admin/goals", label: "จัดการเป้าหมาย (KPIs)", icon: Target });
    allItems.push({ href: "/admin/system", label: "จัดการระบบ", icon: Settings });
  } else {
    allItems.push({ href: "/district/officers", label: "จัดการทีม", icon: Users });
    allItems.push({ href: "/goals", label: "เป้าหมายและตัวชี้วัด", icon: Target });
  }

  return (
    <>
      {/* Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] flex h-[68px] items-center justify-around border-t border-slate-200 bg-white/95 pb-safe backdrop-blur-md md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className={`flex w-full flex-col items-center justify-center space-y-1 py-1 transition-colors ${
                isActive ? "text-teal-600" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <div
                className={`flex h-8 w-12 items-center justify-center rounded-full transition-all ${
                  isActive ? "bg-teal-100" : "bg-transparent"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex w-full flex-col items-center justify-center space-y-1 py-1 transition-colors ${
            isMenuOpen ? "text-teal-600" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <div
            className={`flex h-8 w-12 items-center justify-center rounded-full transition-all ${
              isMenuOpen ? "bg-teal-100" : "bg-transparent"
            }`}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" strokeWidth={2.5} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={2} />
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight">เมนู</span>
        </button>
      </div>

      {/* Full Screen Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-slate-50 pt-20 pb-24 md:hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between px-6 pb-4 border-b border-slate-200">
            <h2 className="text-xl font-extrabold text-slate-800">เมนูทั้งหมด</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {allItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-4 rounded-2xl p-4 transition-all ${
                    isActive
                      ? "bg-teal-600 text-white shadow-md"
                      : "bg-white text-slate-700 shadow-sm border border-slate-100"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      isActive ? "bg-white/20" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-bold">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

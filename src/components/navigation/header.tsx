"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Map,
  Activity,
  Navigation,
  Smartphone,
  Database,
  ShieldCheck,
  Building2,
  Calendar,
  ClipboardCheck,
  Settings,
  Target,
  Users,
} from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { user, isProvinceAdmin } = useAuth();

  const navItems = [
    { href: "/workspace", label: "พื้นที่ทำงาน", icon: Activity },
    { href: "/", label: "ศูนย์บัญชาการ", icon: Activity },
    { href: "/map", label: "Smart Map", icon: Map },
    { href: "/surveillance", label: "เฝ้าระวังระบาดวิทยา", icon: ShieldCheck },
    { href: "/plans/smart", label: "แผนตรวจอัจฉริยะ", icon: Navigation },
    { href: "/inspections", label: "ผลการตรวจ & PDF", icon: ClipboardCheck },
    { href: "/inspections/field", label: "Field GPS", icon: Smartphone },
    { href: "/data-quality", label: "คุณภาพข้อมูล", icon: Database },
  ];

  if (isProvinceAdmin) {
    navItems.push({ href: "/admin/goals", label: "จัดการเป้าหมาย (KPIs)", icon: Target });
    navItems.push({ href: "/admin/users", label: "จัดการระบบ", icon: Settings });
  } else {
    // District roles
    navItems.push({ href: "/district/officers", label: "จัดการทีม", icon: Users });
    navItems.push({ href: "/goals", label: "เป้าหมายและตัวชี้วัด", icon: Target });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-white shadow-md shadow-teal-600/20 overflow-hidden border border-teal-100">
              <img src="/cscp.jpg" alt="CSCP Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  CSCP <span className="text-teal-600 font-extrabold">GeoEpi</span>
                </span>
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 border border-teal-200">
                  v1.0 XAMPP
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                Consumer Safety & Geo-Epidemiological Intelligence
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex flex-1 items-center overflow-hidden mx-2">
          <nav className="flex items-center gap-1 overflow-x-auto hide-scrollbar w-full px-2 py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-teal-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        </div>

        {/* District & Context Badge */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 font-semibold">
                <Building2 className="h-3.5 w-3.5 text-teal-600" />
                <span>
                  {isProvinceAdmin ? "สสจ. ระยอง" : `สสอ. ${user.district} • ระยอง`}
                </span>
              </div>
              <button
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  window.location.href = "/login";
                }}
                className="text-xs font-semibold text-slate-500 hover:text-red-600 px-2 transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
              เข้าสู่ระบบ
            </Link>
          )}

          <div className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/50 px-2.5 py-1 text-xs font-semibold text-teal-800">
            <Calendar className="h-3.5 w-3.5 text-teal-600" />
            <span>ปีงบประมาณ 2569</span>
          </div>
        </div>
      </div>

      {/* Mobile Nav Scroller (Hidden in favor of BottomNav) */}
      <div className="hidden overflow-x-auto border-t border-slate-100 px-4 py-2 gap-2 bg-slate-50/50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                isActive
                  ? "bg-teal-600 text-white"
                  : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}

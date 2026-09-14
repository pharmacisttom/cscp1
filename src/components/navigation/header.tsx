"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "ศูนย์บัญชาการ", icon: Activity },
    { href: "/map", label: "Smart Map", icon: Map },
    { href: "/surveillance", label: "เฝ้าระวังระบาดวิทยา", icon: ShieldCheck },
    { href: "/plans/smart", label: "แผนตรวจอัจฉริยะ", icon: Navigation },
    { href: "/inspections", label: "ผลการตรวจ & PDF", icon: ClipboardCheck },
    { href: "/inspections/field", label: "Field GPS", icon: Smartphone },
    { href: "/data-quality", label: "คุณภาพข้อมูล", icon: Database },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
              <ShieldCheck className="h-6 w-6" />
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
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
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

        {/* District & Context Badge */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
            <Building2 className="h-3.5 w-3.5 text-teal-600" />
            <span>สสอ.ปลวกแดง • ระยอง</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/50 px-2.5 py-1 text-xs font-semibold text-teal-800">
            <Calendar className="h-3.5 w-3.5 text-teal-600" />
            <span>ปีงบประมาณ 2569</span>
          </div>
        </div>
      </div>

      {/* Mobile Nav Scroller */}
      <div className="flex md:hidden overflow-x-auto border-t border-slate-100 px-4 py-2 gap-2 bg-slate-50/50">
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

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { navItems } from './Sidebar';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentNav = navItems.find((item) => item.href === pathname) || { label: 'لوحة التحكم', icon: LayoutDashboard };
  const CurrentIcon = currentNav.icon || LayoutDashboard;

  return (
    <>
      <header className="bg-[#0c0c10] border-b border-[#1e1e26] sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 text-slate-300 hover:text-white rounded-xl bg-[#181822] border border-[#272736] transition-colors shadow-sm cursor-pointer"
            aria-label="القائمة الجانبية"
          >
            <Menu className="w-5 h-5 text-[#FFB50F]" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#181822] border border-[#272736] flex items-center justify-center text-[#FFB50F] shrink-0 shadow-sm">
              <CurrentIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">{currentNav.label}</h2>
              <p className="text-[11px] sm:text-xs text-slate-400" suppressHydrationWarning>
                {new Intl.DateTimeFormat('ar-EG', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }).format(new Date())}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181822] hover:bg-[#222230] text-slate-300 text-xs font-medium transition-colors border border-[#272736]"
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#FFB50F' }}></span>
            <span className="hidden sm:inline">تليجرام</span>
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 max-w-[80%] bg-[#0c0c10] h-full shadow-2xl flex flex-col border-l border-[#1e1e26] animate-in slide-in-from-right duration-200">
            <div className="p-5 flex items-center justify-between border-b border-[#1e1e26]">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Madany Finance Logo"
                  width={38}
                  height={38}
                  className="rounded-xl shadow-md border border-[#272736]"
                />
                <div>
                  <h3 className="text-white font-extrabold text-base leading-tight">إدارة أموالي</h3>
                  <span className="text-[11px] text-slate-400">Madany Finance</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#181822] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-[#FFB50F]/10 text-[#FFB50F] font-bold'
                        : 'text-slate-400 hover:bg-[#181822] hover:text-white font-medium'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-[#FFB50F]' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

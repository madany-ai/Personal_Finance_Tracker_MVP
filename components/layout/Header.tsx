'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { navItems } from './Sidebar';
import { Bell, ShieldCheck, Menu, X } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentNav = navItems.find((item) => item.href === pathname) || { label: 'لوحة التحكم' };

  return (
    <>
      <header className="bg-[#0c0c10] border-b border-[#1e1e26] sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-1.5 -ml-1 text-slate-300 hover:text-white rounded-lg hover:bg-[#181822] transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white">{currentNav.label}</h2>
            <p className="text-xs text-slate-400" suppressHydrationWarning>
              {new Intl.DateTimeFormat('ar-EG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(new Date())}
            </p>
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
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-[#FFB50F] to-[#FF8C00] flex items-center justify-center shadow-lg shadow-[#FFB50F]/20">
                  <span className="text-black font-bold text-lg">M</span>
                </div>
                <span className="text-white font-bold text-lg">Madany</span>
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

'use client';

import { usePathname } from 'next/navigation';
import { navItems } from './Sidebar';
import { Bell, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const pathname = usePathname();
  const currentNav = navItems.find((item) => item.href === pathname) || { label: 'لوحة التحكم' };

  return (
    <header className="bg-[#0c0c10] border-b border-[#1e1e26] sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
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

      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181822] hover:bg-[#222230] text-slate-300 text-xs font-medium transition-colors border border-[#272736]"
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#FFB50F' }}></span>
          <span>تليجرام</span>
        </Link>
      </div>
    </header>
  );
}

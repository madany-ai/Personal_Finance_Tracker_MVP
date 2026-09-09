'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  HandCoins,
  Receipt,
  CalendarClock,
  PieChart,
  Settings,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import QuickTransactionModal from '@/components/dashboard/QuickTransactionModal';

export const navItems = [
  { href: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/transactions', label: 'العمليات المالية', icon: ArrowLeftRight },
  { href: '/accounts', label: 'الحسابات والمحافظ', icon: Wallet },
  { href: '/receivables', label: 'لي عند الآخرين', icon: HandCoins },
  { href: '/payables', label: 'عليّ للآخرين', icon: Receipt },
  { href: '/installments', label: 'الأقساط', icon: CalendarClock },
  { href: '/reports', label: 'التقارير المالية', icon: PieChart },
  { href: '/settings', label: 'الإعدادات والتليجرام', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [showQuickModal, setShowQuickModal] = useState(false);

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 bg-[#0c0c10] border-l border-[#1e1e26] h-screen sticky top-0">
        {/* Brand */}
        <div className="p-6 border-b border-[#1e1e26] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-extrabold text-xl shadow-md"
              style={{ backgroundColor: '#FFB50F', boxShadow: '0 4px 14px 0 rgba(255, 181, 15, 0.35)' }}
            >
              💰
            </div>
            <div>
              <h1 className="font-extrabold text-white text-base leading-tight">إدارة أموالي</h1>
              <span className="text-xs text-slate-400 font-medium">نظام المراقبة الشخصي</span>
            </div>
          </div>
        </div>

        {/* Quick Add Button */}
        <div className="px-4 pt-5 pb-2">
          <button
            onClick={() => setShowQuickModal(true)}
            className="w-full flex items-center justify-center gap-2 font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer text-sm active:scale-98"
            style={{
              backgroundColor: '#FFB50F',
              color: '#000000',
              boxShadow: '0 2px 8px 0 rgba(255, 181, 15, 0.4)',
            }}
          >
            <PlusCircle className="w-5 h-5" />
            <span>تسجيل عملية سريعة</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'font-bold shadow-xs'
                    : 'text-slate-400 hover:bg-[#161622] hover:text-white'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: 'rgba(15, 95, 255, 0.15)',
                        color: '#0F5FFF',
                        border: '1px solid rgba(15, 95, 255, 0.3)',
                      }
                    : undefined
                }
              >
                <Icon
                  className="w-5 h-5 transition-colors"
                  style={{ color: isActive ? '#0F5FFF' : '#64748b' }}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#1e1e26]">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer hover:bg-red-950/40"
            style={{ color: '#FF0628' }}
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {showQuickModal && (
        <QuickTransactionModal onClose={() => setShowQuickModal(false)} onSuccess={() => window.location.reload()} />
      )}
    </>
  );
}

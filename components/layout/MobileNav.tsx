'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Wallet, PieChart, Plus, Settings } from 'lucide-react';
import { useState } from 'react';
import QuickTransactionModal from '@/components/dashboard/QuickTransactionModal';

export default function MobileNav() {
  const pathname = usePathname();
  const [showQuickModal, setShowQuickModal] = useState(false);

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c10] border-t border-[#1e1e26] px-2 py-1 flex items-center justify-around shadow-2xl">
        <Link
          href="/"
          className={`flex flex-col items-center py-1.5 px-2 text-xs font-medium transition-colors ${
            pathname === '/' ? 'font-bold' : 'text-slate-400'
          }`}
          style={pathname === '/' ? { color: '#0F5FFF' } : undefined}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>الرئيسية</span>
        </Link>

        <Link
          href="/transactions"
          className={`flex flex-col items-center py-1.5 px-2 text-xs font-medium transition-colors ${
            pathname === '/transactions' ? 'font-bold' : 'text-slate-400'
          }`}
          style={pathname === '/transactions' ? { color: '#0F5FFF' } : undefined}
        >
          <ArrowLeftRight className="w-5 h-5 mb-0.5" />
          <span>العمليات</span>
        </Link>

        {/* Center Action Button (Primary #FFB50F) */}
        <button
          onClick={() => setShowQuickModal(true)}
          className="w-12 h-12 -mt-6 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
          style={{
            backgroundColor: '#FFB50F',
            color: '#000000',
            boxShadow: '0 4px 14px 0 rgba(255, 181, 15, 0.45)',
          }}
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        <Link
          href="/reports"
          className={`flex flex-col items-center py-1.5 px-2 text-xs font-medium transition-colors ${
            pathname === '/reports' ? 'font-bold' : 'text-slate-400'
          }`}
          style={pathname === '/reports' ? { color: '#0F5FFF' } : undefined}
        >
          <PieChart className="w-5 h-5 mb-0.5" />
          <span>التقارير</span>
        </Link>

        <Link
          href="/settings"
          className={`flex flex-col items-center py-1.5 px-2 text-xs font-medium transition-colors ${
            pathname === '/settings' ? 'font-bold' : 'text-slate-400'
          }`}
          style={pathname === '/settings' ? { color: '#0F5FFF' } : undefined}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span>الإعدادات</span>
        </Link>
      </div>

      {showQuickModal && (
        <QuickTransactionModal onClose={() => setShowQuickModal(false)} onSuccess={() => window.location.reload()} />
      )}
    </>
  );
}

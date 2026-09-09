'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Scale,
  PiggyBank,
  Loader2,
  CalendarRange,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { fetchWithClientCache } from '@/lib/client-cache';

const ReportsCharts = dynamic(() => import('@/components/charts/ReportsCharts'), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center text-xs text-slate-500">
      جاري تحميل الرسم البياني...
    </div>
  ),
});

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export default function ReportsPage() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchReport(forceRefresh = false) {
    setLoading(true);
    try {
      let url = `/api/reports?period=${period}`;
      if (period === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const resData = await fetchWithClientCache<any>(url, { forceRefresh });
      setData(resData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (period !== 'custom' || (customStart && customEnd)) {
      fetchReport();
    }
  }, [period, customStart, customEnd]);

  const s = data?.summary || {};
  const curr = data?.currency || 'ج.م';

  return (
    <div className="space-y-6">
      {/* Header and Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111116] p-5 rounded-2xl border border-[#23232e] shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white">التقارير والتحليلات المالية</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            تحليل دقيق لأين تذهب أموالك، معدل ادخارك، وصافي دخلك حسب الفترة
          </p>
        </div>

        {/* Period Tabs */}
        <div className="flex items-center p-1 bg-[#181822] border border-[#23232e] rounded-xl text-xs font-semibold">
          <button
            onClick={() => setPeriod('day')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              period === 'day' ? 'bg-[#FFB50F] text-black font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            تقرير يومي
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              period === 'week' ? 'bg-[#FFB50F] text-black font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            أسبوعي
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              period === 'month' ? 'bg-[#FFB50F] text-black font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            شهري
          </button>
          <button
            onClick={() => setPeriod('custom')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              period === 'custom' ? 'bg-[#FFB50F] text-black font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            نطاق مخصص
          </button>
        </div>
      </div>

      {/* Custom Range Picker if active */}
      {period === 'custom' && (
        <div className="bg-[#111116] p-4 rounded-xl border border-[#23232e] flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <CalendarRange className="w-4 h-4 text-[#0F5FFF]" />
            <span>حدد الفترة:</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">من:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-lg text-xs"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">إلى:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-lg text-xs"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-16 flex items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mr-2 text-[#FFB50F]" />
          <span className="text-sm">جاري إنشاء التقرير المالي...</span>
        </div>
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-[#111116] p-4 rounded-xl border border-[#23232e]">
              <span className="text-slate-400 text-xs font-medium">إجمالي الدخل</span>
              <div className="text-lg font-bold text-[#0F5FFF] mt-1">
                +{formatCurrency(s.totalIncome, curr)}
              </div>
            </div>

            <div className="bg-[#111116] p-4 rounded-xl border border-[#23232e]">
              <span className="text-slate-400 text-xs font-medium">إجمالي المصروفات</span>
              <div className="text-lg font-bold text-[#FF0628] mt-1">
                -{formatCurrency(s.totalExpense, curr)}
              </div>
            </div>

            <div className="bg-[#111116] p-4 rounded-xl border border-[#23232e]">
              <span className="text-slate-400 text-xs font-medium">صافي الفترة (المدخرات)</span>
              <div
                className="text-lg font-bold mt-1"
                style={{ color: s.net >= 0 ? '#0F5FFF' : '#FF0628' }}
              >
                {s.net >= 0 ? '+' : ''}
                {formatCurrency(s.net, curr)}
              </div>
            </div>

            <div className="bg-[#111116] p-4 rounded-xl border border-[#23232e]">
              <span className="text-slate-400 text-xs font-medium">
                {period === 'day' ? 'أكبر مصروف اليوم' : 'نسبة الادخار'}
              </span>
              <div className="text-lg font-bold text-white mt-1">
                {period === 'day' ? formatCurrency(s.largestExpense, curr) : (
                  <span style={{ color: '#FFB50F' }}>{s.savingsRate}%</span>
                )}
              </div>
            </div>
          </div>

          {/* Secondary stats */}
          {period !== 'day' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-[#161622] p-3.5 rounded-xl border border-[#23232e] text-xs">
                <span className="text-slate-400">متوسط الإنفاق اليومي:</span>{' '}
                <b className="text-white mr-1">{formatCurrency(s.dailyAverage, curr)}</b>
              </div>
              <div className="bg-[#161622] p-3.5 rounded-xl border border-[#23232e] text-xs">
                <span className="text-slate-400">الرصيد الفعلي الحالي:</span>{' '}
                <b className="text-[#0F5FFF] mr-1">{formatCurrency(s.currentBalance, curr)}</b>
              </div>
              <div className="bg-[#161622] p-3.5 rounded-xl border border-[#23232e] text-xs">
                <span className="text-slate-400">مجموع الأقساط المدفوعة:</span>{' '}
                <b className="text-white mr-1">{formatCurrency(s.totalInstallmentsPaid, curr)}</b>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown Chart */}
            <div className="bg-[#111116] p-6 rounded-2xl border border-[#23232e]">
              <h3 className="font-bold text-white text-base pb-3 border-b border-[#23232e]">
                المصروفات حسب التصنيف
              </h3>

              {(!data?.categoryBreakdown || data.categoryBreakdown.length === 0) ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  لا توجد مصروفات مسجلة في هذه الفترة
                </div>
              ) : (
                <ReportsCharts
                  type="pie"
                  data={data.categoryBreakdown}
                  colors={COLORS}
                  currency={curr}
                  dataKey="amount"
                />
              )}

              {/* Table of categories */}
              <div className="space-y-2 mt-4 max-h-48 overflow-y-auto">
                {data?.categoryBreakdown?.map((cat: any, i: number) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      ></span>
                      <span className="font-medium text-slate-300">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">({cat.percentage}%)</span>
                      <span className="font-bold text-white">
                        {formatCurrency(cat.amount, curr)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Spending Days or Bar Chart */}
            <div className="bg-[#111116] p-6 rounded-2xl border border-[#23232e]">
              <h3 className="font-bold text-white text-base pb-3 border-b border-[#23232e]">
                الأيام الأعلى إنفاقًا خلال الفترة
              </h3>

              {(!data?.topSpendingDays || data.topSpendingDays.length === 0) ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  لا توجد بيانات إنفاق متاحة
                </div>
              ) : (
                <ReportsCharts
                  type="bar"
                  data={data.topSpendingDays}
                  currency={curr}
                  dataKey="amount"
                  xKey="date"
                />
              )}

              {/* Top days list */}
              <div className="space-y-2 mt-4">
                {data?.topSpendingDays?.map((d: any) => (
                  <div key={d.date} className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-300">{formatDate(d.date)}</span>
                    <span className="font-bold text-[#FF0628]">
                      {formatCurrency(d.amount, curr)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

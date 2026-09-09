'use client';

import { useEffect, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  PiggyBank,
  HandCoins,
  Receipt,
  CalendarClock,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Loader2,
  Clock,
  PlusCircle,
  AlertCircle,
  Plus,
  CheckCircle2,
  X,
  Sparkles,
  Coins,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { formatCurrency, formatDate } from '@/lib/utils';
import QuickTransactionModal from '@/components/dashboard/QuickTransactionModal';
import { fetchWithClientCache, invalidateClientCache } from '@/lib/client-cache';

const CategoryPieChart = dynamic(() => import('@/components/charts/CategoryPieChart'), {
  ssr: false,
  loading: () => (
    <div className="h-48 flex items-center justify-center text-xs text-slate-500">
      جاري تحميل الرسم البياني...
    </div>
  ),
});

const COLORS = ['#FFB50F', '#0F5FFF', '#FF0628', '#000000', '#f59e0b', '#8b5cf6', '#06b6d4', '#64748b'];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showQuickModal, setShowQuickModal] = useState(false);

  // Commitments vs Expected Income tab
  const [activeTab, setActiveTab] = useState<'commitments' | 'expected'>('commitments');
  const [showExpectedModal, setShowExpectedModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedExpected, setSelectedExpected] = useState<any>(null);
  const [depositAccountId, setDepositAccountId] = useState<string>('');

  // Expected Income form
  const [expectedSource, setExpectedSource] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [expectedDate, setExpectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDesc, setExpectedDesc] = useState('');
  const [submittingExpected, setSubmittingExpected] = useState(false);
  const [receivingIncome, setReceivingIncome] = useState(false);

  async function fetchDashboardData(forceRefresh = false) {
    try {
      const json = await fetchWithClientCache('/api/dashboard', { forceRefresh });
      setData(json);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function handleAddExpectedIncome(e: React.FormEvent) {
    e.preventDefault();
    if (!expectedSource || !expectedAmount) return;
    setSubmittingExpected(true);
    try {
      const res = await fetch('/api/expected-income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: expectedSource,
          amount: parseFloat(expectedAmount),
          expectedDate,
          description: expectedDesc,
        }),
      });
      if (res.ok) {
        setShowExpectedModal(false);
        setExpectedSource('');
        setExpectedAmount('');
        setExpectedDesc('');
        invalidateClientCache('/api/');
        fetchDashboardData(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingExpected(false);
    }
  }

  async function handleReceiveExpectedIncome() {
    if (!selectedExpected) return;
    setReceivingIncome(true);
    try {
      const res = await fetch(`/api/expected-income/${selectedExpected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'receive',
          accountId: depositAccountId ? parseInt(depositAccountId) : (data?.accounts?.[0]?.id || null),
        }),
      });
      if (res.ok) {
        setShowReceiveModal(false);
        setSelectedExpected(null);
        invalidateClientCache('/api/');
        fetchDashboardData(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReceivingIncome(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-3 text-[#0F5FFF]" />
        <p className="text-sm font-medium">جاري تحميل بيانات لوحة التحكم...</p>
      </div>
    );
  }

  const m = data?.metrics || {};
  const curr = m.currency || 'ج.م';

  return (
    <div className="space-y-6">
      {/* 1. Top Bar with Welcome and Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111116] p-5 rounded-2xl border border-[#23232e] shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white">مرحبًا بك في لوحتك المالية 👋</h1>
          <p className="text-xs text-slate-400 mt-0.5">نظرة شاملة ودقيقة على كل مدخلاتك ومخرجاتك وأرصدتك</p>
        </div>
        <button
          onClick={() => setShowQuickModal(true)}
          className="flex items-center justify-center gap-2 font-extrabold py-2.5 px-5 rounded-xl transition-all cursor-pointer text-sm active:scale-98"
          style={{
            backgroundColor: '#FFB50F',
            color: '#000000',
            boxShadow: '0 4px 14px 0 rgba(255, 181, 15, 0.4)',
          }}
        >
          <PlusCircle className="w-4 h-4" />
          <span>تسجيل عملية سريعة</span>
        </button>
      </div>

      {/* 2. Distinct Dual Hero Cards: الرصيد الفعلي المتاح vs صافي الوضع المالي الحقيقي (PRD Section 16) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Available Balance (Secondary #0F5FFF) */}
        <div
          className="text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between border border-[#0F5FFF]/40"
          style={{
            background: 'linear-gradient(135deg, #093ca8 0%, #061c52 100%)',
            boxShadow: '0 8px 28px 0 rgba(15, 95, 255, 0.25)',
          }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                الرصيد الفعلي المتاح الآن
              </span>
              <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
                <Wallet className="w-5 h-5 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-black mt-2 tracking-tight text-white">
              {formatCurrency(m.currentBalance, curr)}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-black/35 text-white border border-white/10">
                ⚡ سيولة حرة للصرف: {formatCurrency(m.liquidBalance ?? m.currentBalance, curr)}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#FFB50F]/20 text-[#FFB50F] border border-[#FFB50F]/30">
                🛡️ شايلهم على جنب: {formatCurrency(m.savedBalance ?? 0, curr)}
              </span>
            </div>
            <p className="text-xs text-blue-200/80 mt-2">
              مجموع السيولة النقدية الفعلية في حساباتك البنكية والمحافظ والكاش والمدخرات
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-blue-200">
            <span>عدد الحسابات: {data?.accounts?.length || 0}</span>
            <span className="font-semibold">أموال ملكك 100%</span>
          </div>
        </div>

        {/* Net Worth (Dark #000000 + Primary #FFB50F) */}
        <div
          className="text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between border border-[#FFB50F]/30 bg-[#0d0d12]"
          style={{
            boxShadow: '0 8px 28px 0 rgba(0, 0, 0, 0.6)',
          }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                صافي الوضع المالي الحقيقي (Net Worth)
              </span>
              <div
                className="p-2 rounded-xl text-black font-bold"
                style={{ backgroundColor: '#FFB50F' }}
              >
                <Scale className="w-5 h-5" />
              </div>
            </div>
            <h2
              className="text-3xl font-black mt-2 tracking-tight"
              style={{ color: '#FFB50F' }}
            >
              {formatCurrency(m.netWorth, curr)}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              (الرصيد الحالي + ما لك عند الآخرين) − ما عليك للآخرين
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#23232e] flex items-center justify-between text-xs text-slate-400">
            <span style={{ color: '#0F5FFF' }} className="font-bold">
              لك: +{formatCurrency(m.totalReceivables, curr)}
            </span>
            <span style={{ color: '#FF0628' }} className="font-bold">
              عليك: -{formatCurrency(m.totalPayables, curr)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Metrics Cards Grid: 10 Comprehensive Cards (PRD Section 15) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* دخل اليوم */}
        <div className="bg-[#111116] p-4 rounded-xl border border-[#23232e]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>دخل اليوم</span>
            <TrendingUp className="w-4 h-4" style={{ color: '#0F5FFF' }} />
          </div>
          <div className="text-lg font-black mt-1" style={{ color: '#0F5FFF' }}>
            +{formatCurrency(m.todayIncome, curr)}
          </div>
        </div>

        {/* مصروفات اليوم */}
        <div className="bg-[#111116] p-4 rounded-xl border border-[#23232e]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>مصروفات اليوم</span>
            <TrendingDown className="w-4 h-4" style={{ color: '#FF0628' }} />
          </div>
          <div className="text-lg font-black mt-1" style={{ color: '#FF0628' }}>
            -{formatCurrency(m.todayExpense, curr)}
          </div>
        </div>

        {/* صافي اليوم */}
        <div className="bg-[#111116] p-4 rounded-xl border border-[#23232e]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>صافي اليوم</span>
            <Scale className="w-4 h-4 text-slate-400" />
          </div>
          <div
            className="text-lg font-black mt-1"
            style={{ color: m.todayNet >= 0 ? '#0F5FFF' : '#FF0628' }}
          >
            {m.todayNet >= 0 ? '+' : ''}
            {formatCurrency(m.todayNet, curr)}
          </div>
        </div>

        {/* نسبة الادخار هذا الشهر */}
        <div className="bg-[#111116] p-4 rounded-xl border border-[#23232e] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>نسبة ادخار الشهر</span>
            <PiggyBank className="w-4 h-4" style={{ color: '#FFB50F' }} />
          </div>
          <div className="mt-1">
            <div className="flex items-baseline justify-between">
              <div className="text-lg font-black text-white">
                <span style={{ color: '#FFB50F' }}>{m.savingsRate}%</span>
                <span className="text-[10px] font-normal text-slate-400 mr-1">
                  (هدف: {m.targetSavingsRate || 20}%)
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                {formatCurrency(m.monthSavings, curr)}
              </span>
            </div>
            {/* Progress Bar towards Savings Target */}
            <div className="w-full bg-[#1e1e2c] h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(Math.max((m.savingsRate / (m.targetSavingsRate || 20)) * 100, 0), 100)}%`,
                  backgroundColor: m.savingsRate >= (m.targetSavingsRate || 20) ? '#FFB50F' : '#0F5FFF',
                }}
              />
            </div>
          </div>
        </div>

        {/* أموال شايلها على جنب (المدخرات) */}
        <div className="bg-[#111116] p-4 rounded-xl border border-[#FFB50F]/30 shadow-xs">
          <div className="flex items-center justify-between text-[#FFB50F] text-xs font-bold">
            <span>شايل فلوس (مدخرات)</span>
            <PiggyBank className="w-4 h-4" />
          </div>
          <div className="text-lg font-black mt-1 text-[#FFB50F]">
            {formatCurrency(m.savedBalance ?? 0, curr)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">توفير وطوارئ واستثمار</span>
        </div>

        {/* دخل الشهر */}
        <div className="bg-[#111116] p-4 rounded-xl border border-[#23232e]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>دخل الشهر</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-black mt-1" style={{ color: '#0F5FFF' }}>
            +{formatCurrency(m.monthIncome, curr)}
          </div>
        </div>

        {/* مصروفات الشهر */}
        <div className="bg-[#111116] p-4 rounded-xl border border-[#23232e]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>مصروفات الشهر</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-black mt-1" style={{ color: '#FF0628' }}>
            -{formatCurrency(m.monthExpense, curr)}
          </div>
        </div>

        {/* الدخل المتوقع القادم */}
        <div className="bg-[#111116] p-4 rounded-xl border border-[#0F5FFF]/30">
          <div className="flex items-center justify-between text-sky-400 text-xs font-semibold">
            <span>الدخل المتوقع</span>
            <Coins className="w-4 h-4" />
          </div>
          <div className="text-lg font-black mt-1 text-sky-400">
            +{formatCurrency(m.totalExpectedIncome || 0, curr)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">أموال منتظر وصولها</span>
        </div>

        {/* لي عند الآخرين */}
        <div className="bg-[#111116] p-4 rounded-xl border border-[#23232e]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>لي عند الآخرين</span>
            <HandCoins className="w-4 h-4" style={{ color: '#0F5FFF' }} />
          </div>
          <div className="text-lg font-black mt-1" style={{ color: '#0F5FFF' }}>
            {formatCurrency(m.totalReceivables, curr)}
          </div>
        </div>

        {/* عليّ للآخرين */}
        <div className="bg-[#111116] p-4 rounded-xl border border-[#23232e]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>عليّ للآخرين</span>
            <Receipt className="w-4 h-4" style={{ color: '#FF0628' }} />
          </div>
          <div className="text-lg font-black mt-1" style={{ color: '#FF0628' }}>
            {formatCurrency(m.totalPayables, curr)}
          </div>
        </div>
      </div>

      {/* 4. Two Columns: الالتزامات والدخل المتوقع + توزيع المصروفات للشارت */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 12 & 13: الالتزامات القادمة والدخل المتوقع */}
        <div className="lg:col-span-2 bg-[#111116] p-6 rounded-2xl border border-[#23232e]">
          {/* Tabs header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#23232e]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('commitments')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'commitments'
                    ? 'bg-[#0F5FFF] text-white shadow-md'
                    : 'bg-[#181822] text-slate-400 hover:text-white border border-[#23232e]'
                }`}
              >
                الالتزامات والأقساط القادمة ({data?.upcomingCommitments?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('expected')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'expected'
                    ? 'bg-[#FFB50F] text-black shadow-md'
                    : 'bg-[#181822] text-slate-400 hover:text-white border border-[#23232e]'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>الدخل المتوقع القادم ({data?.expectedIncome?.length || 0})</span>
              </button>
            </div>

            {activeTab === 'expected' && (
              <button
                onClick={() => setShowExpectedModal(true)}
                className="px-3 py-1 rounded-xl text-xs font-bold bg-[#FFB50F] text-black hover:bg-[#ffc334] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>تسجيل دخل متوقع</span>
              </button>
            )}
          </div>

          {/* Tab 1: الالتزامات القادمة */}
          {activeTab === 'commitments' && (
            <div className="mt-4 space-y-3">
              {(!data?.upcomingCommitments || data.upcomingCommitments.length === 0) ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  لا توجد التزامات أو أقساط قادمة مسجلة حاليًا 🎉
                </div>
              ) : (
                data.upcomingCommitments.map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#161622] border border-[#23232e] hover:border-[#323242] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#0F5FFF]/15 border border-[#0F5FFF]/30 text-[#0F5FFF] flex items-center justify-center font-bold text-xs">
                        {c.type === 'قسط' ? 'قسط' : 'تكرار'}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{c.title}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{formatDate(c.dueDate)}</span>
                          <span>•</span>
                          <span>{c.details}</span>
                        </div>
                      </div>
                    </div>
                    <div className="font-extrabold text-sm text-white">
                      {formatCurrency(c.amount, curr)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: الدخل المتوقع القادم */}
          {activeTab === 'expected' && (
            <div className="mt-4 space-y-3">
              {(!data?.expectedIncome || data.expectedIncome.length === 0) ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  لا يوجد دخل متوقع مسجل حاليًا. اضغط على "تسجيل دخل متوقع" لإضافة أي أموال منتظر استلامها.
                </div>
              ) : (
                data.expectedIncome.map((inc: any) => (
                  <div
                    key={inc.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#161622] border border-[#23232e] hover:border-[#323242] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#FFB50F]/15 border border-[#FFB50F]/30 text-[#FFB50F] flex items-center justify-center font-bold text-xs">
                        متوقع
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{inc.source}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>تاريخ الوصول: {formatDate(inc.expectedDate)}</span>
                          {inc.description && <span>• {inc.description}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="font-extrabold text-sm text-sky-400">
                        +{formatCurrency(inc.amount, curr)}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedExpected(inc);
                          setShowReceiveModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800 hover:bg-emerald-900 transition-colors cursor-pointer"
                      >
                        تم الاستلام ✓
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Expenses by Category Chart */}
        <div className="bg-[#111116] p-6 rounded-2xl border border-[#23232e] flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base pb-3 border-b border-[#23232e]">
              توزيع المصروفات (الشهر)
            </h3>
            {(!data?.categorySpending || data.categorySpending.length === 0) ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                لم تسجل مصروفات هذا الشهر بعد
              </div>
            ) : (
              <CategoryPieChart
                data={data.categorySpending}
                colors={COLORS}
                currency={curr}
              />
            )}
          </div>

          {/* Categories mini list */}
          <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto">
            {data?.categorySpending?.slice(0, 4).map((cat: any, i: number) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  ></span>
                  <span className="text-slate-300">{cat.name}</span>
                </div>
                <span className="font-semibold text-white">
                  {formatCurrency(cat.value, curr)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Two Columns: الحسابات والمحافظ + آخر العمليات */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* الحسابات والمحافظ */}
        <div className="bg-[#111116] p-6 rounded-2xl border border-[#23232e]">
          <div className="flex items-center justify-between pb-4 border-b border-[#23232e]">
            <h3 className="font-bold text-white text-base">الحسابات والمحافظ</h3>
            <span className="text-xs text-[#0F5FFF] font-medium cursor-pointer">
              إجمالي: {formatCurrency(m.currentBalance, curr)}
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {data?.accounts?.map((a: any) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#161622] border border-[#23232e]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FFB50F]/20 text-[#FFB50F] border border-[#FFB50F]/30 flex items-center justify-center text-xs font-bold">
                    {a.type === 'bank' ? 'بنك' : a.type === 'cash' ? 'كاش' : 'محفظة'}
                  </div>
                  <span className="font-semibold text-sm text-slate-200">{a.name}</span>
                </div>
                <span className="font-bold text-sm text-white">
                  {formatCurrency(a.balance, curr)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* آخر العمليات */}
        <div className="lg:col-span-2 bg-[#111116] p-6 rounded-2xl border border-[#23232e]">
          <div className="flex items-center justify-between pb-4 border-b border-[#23232e]">
            <h3 className="font-bold text-white text-base">آخر العمليات المالية</h3>
            <span className="text-xs text-slate-400">آخر العمليات المسجلة</span>
          </div>

          <div className="mt-4 divide-y divide-[#23232e]">
            {(!data?.recentTransactions || data.recentTransactions.length === 0) ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                لم تسجل أي عمليات مالية بعد. اضغط على تسجيل عملية سريعة لبدء التسجيل.
              </div>
            ) : (
              data.recentTransactions.map((tx: any) => {
                const isIncome = tx.type === 'income';
                const isExpense = tx.type === 'expense';
                return (
                  <div key={tx.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                        style={{
                          backgroundColor: isIncome ? '#0F5FFF' : isExpense ? '#FF0628' : '#1e1e2c',
                          boxShadow: isIncome
                            ? '0 2px 8px rgba(15, 95, 255, 0.3)'
                            : isExpense
                            ? '0 2px 8px rgba(255, 6, 40, 0.3)'
                            : 'none',
                        }}
                      >
                        {isIncome && <ArrowUpRight className="w-5 h-5" />}
                        {isExpense && <ArrowDownRight className="w-5 h-5" />}
                        {!isIncome && !isExpense && <ArrowLeftRight className="w-4 h-4 text-[#FFB50F]" />}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-white">
                          {tx.description || (isIncome ? 'دخل' : isExpense ? 'مصروف' : 'تحويل')}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{formatDate(tx.transactionDate)}</span>
                          <span>•</span>
                          <span>{tx.account?.name}</span>
                          {tx.category?.name && (
                            <>
                              <span>•</span>
                              <span className="text-slate-300">{tx.category.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className="font-extrabold text-sm"
                      style={{
                        color: isIncome ? '#0F5FFF' : isExpense ? '#FF0628' : '#FFB50F',
                      }}
                    >
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {formatCurrency(tx.amount, curr)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showQuickModal && (
        <QuickTransactionModal
          onClose={() => setShowQuickModal(false)}
          onSuccess={() => {
            invalidateClientCache('/api/');
            fetchDashboardData(true);
          }}
        />
      )}

      {/* Add Expected Income Modal */}
      {showExpectedModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#111116] border border-[#23232e] w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#23232e]">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#FFB50F]" />
                <h3 className="font-bold text-white text-base">تسجيل دخل متوقع جديد</h3>
              </div>
              <button
                onClick={() => setShowExpectedModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpectedIncome} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  مصدر الدخل المتوقع *
                </label>
                <input
                  type="text"
                  required
                  value={expectedSource}
                  onChange={(e) => setExpectedSource(e.target.value)}
                  placeholder="مثال: دفعة عميل، استحقاق جمعية، راتب إضافي"
                  className="w-full text-xs px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#FFB50F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  المبلغ المتوقع ({curr}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expectedAmount}
                  onChange={(e) => setExpectedAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-lg font-bold px-3 py-2 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#FFB50F] text-left dir-ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  تاريخ الوصول المتوقع *
                </label>
                <input
                  type="date"
                  required
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#FFB50F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ملاحظات أو وصف (اختياري)
                </label>
                <input
                  type="text"
                  value={expectedDesc}
                  onChange={(e) => setExpectedDesc(e.target.value)}
                  placeholder="أي تفاصيل أخرى..."
                  className="w-full text-xs px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#FFB50F]"
                />
              </div>

              <div className="p-3 bg-[#181822] border border-[#23232e] rounded-xl text-[11px] text-slate-400">
                💡 <b>قاعدة مالية:</b> الدخل المتوقع لا يُضاف إلى رصيدك الفعلي الآن، ويتم إضافته فقط عند استلامه وتأكيد الإيداع في الحساب.
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submittingExpected}
                  className="flex-1 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs active:scale-98"
                  style={{
                    backgroundColor: '#FFB50F',
                    color: '#000000',
                    boxShadow: '0 2px 8px rgba(255, 181, 15, 0.4)',
                  }}
                >
                  {submittingExpected ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري التسجيل...</span>
                    </>
                  ) : (
                    <span>حفظ الدخل المتوقع</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpectedModal(false)}
                  className="px-4 py-2.5 text-slate-400 hover:text-white bg-[#181822] rounded-xl text-xs font-medium border border-[#2e2e3e]"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Expected Income Modal */}
      {showReceiveModal && selectedExpected && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#111116] border border-[#23232e] w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#23232e]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">تأكيد استلام الدخل وإيداعه</h3>
              </div>
              <button
                onClick={() => {
                  setShowReceiveModal(false);
                  setSelectedExpected(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-[#161622] rounded-xl border border-[#23232e]">
                <div className="text-xs text-slate-400">المصدر والمبلغ:</div>
                <div className="font-bold text-white text-sm mt-0.5">{selectedExpected.source}</div>
                <div className="text-xl font-black text-emerald-400 mt-1">
                  +{formatCurrency(selectedExpected.amount, curr)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  اختر الحساب الذي تم إيداع المبلغ فيه: *
                </label>
                <select
                  value={depositAccountId || (data?.accounts?.[0]?.id || '')}
                  onChange={(e) => setDepositAccountId(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {data?.accounts?.map((acc: any) => (
                    <option key={acc.id} value={acc.id} className="bg-[#181822] text-white">
                      {acc.name} (رصيده الحالي: {formatCurrency(acc.balance, curr)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-[11px] text-emerald-300">
                ✓ سيتم تحويل هذا المبلغ فورًا إلى <b>دخل فعلي محقق</b>، وزيادة رصيد الحساب المختار.
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  disabled={receivingIncome}
                  onClick={handleReceiveExpectedIncome}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs active:scale-98 shadow-md"
                >
                  {receivingIncome ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>جاري الإيداع...</span>
                    </>
                  ) : (
                    <span>تأكيد الإيداع في الحساب ✓</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReceiveModal(false);
                    setSelectedExpected(null);
                  }}
                  className="px-4 py-2.5 text-slate-400 hover:text-white bg-[#181822] rounded-xl text-xs font-medium border border-[#2e2e3e]"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

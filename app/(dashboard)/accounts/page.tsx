'use client';

import { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  Building,
  DollarSign,
  Smartphone,
  PiggyBank,
  ShieldCheck,
  Coins,
  ArrowUpDown,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ACCOUNT_TYPES, isSavingsAccountType } from '@/lib/constants';
import { fetchWithClientCache, invalidateClientCache } from '@/lib/client-cache';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [filterType, setFilterType] = useState<'all' | 'savings' | 'liquid'>('all');

  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [balance, setBalance] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadAccounts(forceRefresh = false) {
    try {
      const data = await fetchWithClientCache<any[]>('/api/accounts', { forceRefresh });
      setAccounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  function openCreate() {
    setEditingAccount(null);
    setName('');
    setType('bank');
    setBalance('0');
    setError('');
    setShowModal(true);
  }

  function openEdit(acc: any) {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setBalance(acc.balance);
    setError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const url = editingAccount ? `/api/accounts/${editingAccount.id}` : '/api/accounts';
      const method = editingAccount ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          balance: parseFloat(balance) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
        setSubmitting(false);
        return;
      }

      setShowModal(false);
      invalidateClientCache('/api/');
      loadAccounts(true);
    } catch (err) {
      console.error(err);
      setError('فشل الاتصال بالخادم');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الحساب؟')) return;

    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'فشل حذف الحساب');
      } else {
        invalidateClientCache('/api/');
        loadAccounts(true);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.balance), 0);
  const savedBalance = accounts
    .filter((a) => isSavingsAccountType(a.type))
    .reduce((sum, a) => sum + parseFloat(a.balance), 0);
  const liquidBalance = accounts
    .filter((a) => !isSavingsAccountType(a.type))
    .reduce((sum, a) => sum + parseFloat(a.balance), 0);

  const filteredAccounts = accounts.filter((a) => {
    if (filterType === 'savings') return isSavingsAccountType(a.type);
    if (filterType === 'liquid') return !isSavingsAccountType(a.type);
    return true;
  });

  function getAccountIcon(t: string) {
    switch (t) {
      case 'bank':
        return <Building className="w-5 h-5 text-sky-400" />;
      case 'cash':
        return <DollarSign className="w-5 h-5 text-emerald-400" />;
      case 'wallet':
        return <Smartphone className="w-5 h-5 text-amber-400" />;
      case 'savings':
        return <PiggyBank className="w-5 h-5 text-[#FFB50F]" />;
      case 'emergency':
        return <ShieldCheck className="w-5 h-5 text-rose-400" />;
      case 'investment':
        return <Coins className="w-5 h-5 text-amber-300" />;
      default:
        return <Wallet className="w-5 h-5 text-slate-400" />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111116] p-5 rounded-2xl border border-[#23232e] shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#181822] border border-[#272736] flex items-center justify-center text-[#FFB50F] shrink-0 shadow-md">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">الحسابات والمحافظ المالية</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              إدارة أماكن وجود أموالك الفعلية (السيولة اليومية، حسابات التوفير، والطوارئ)
            </p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-sm active:scale-98"
          style={{
            backgroundColor: '#FFB50F',
            color: '#000000',
            boxShadow: '0 2px 8px rgba(255, 181, 15, 0.4)',
          }}
        >
          <Plus className="w-4 h-4" />
          <span>إضافة حساب جديد</span>
        </button>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* إجمالي كل الأرصدة */}
        <div
          className="text-white p-5 rounded-2xl shadow-xl flex flex-col justify-between border border-[#0F5FFF]/40"
          style={{
            background: 'linear-gradient(135deg, #093ca8 0%, #061c52 100%)',
            boxShadow: '0 8px 24px rgba(15, 95, 255, 0.25)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-200">إجمالي الرصيد الفعلي الكامل</span>
            <Wallet className="w-4 h-4 text-blue-200" />
          </div>
          <div className="my-2">
            <h2 className="text-2xl font-black text-white">{formatCurrency(totalBalance)}</h2>
            <p className="text-[11px] text-blue-200/80 mt-0.5">مجموع كل ما تملكه في الحسابات والمدخرات</p>
          </div>
          <div className="text-[11px] text-blue-200 pt-2 border-t border-blue-400/20">
            عدد الحسابات: {accounts.length}
          </div>
        </div>

        {/* أموال شايلها على جنب (مدخرات وطوارئ) */}
        <div className="bg-[#111116] p-5 rounded-2xl border border-[#FFB50F]/40 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#FFB50F] flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4" />
              <span>أموال شايلها على جنب (المدخرات)</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFB50F]/20 text-[#FFB50F]">
              توفير وطوارئ
            </span>
          </div>
          <div className="my-2">
            <h2 className="text-2xl font-black text-[#FFB50F]">{formatCurrency(savedBalance)}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">حسابات التوفير، صندوق الطوارئ، والاستثمار</p>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-[#23232e]">
            تشكل {totalBalance > 0 ? Math.round((savedBalance / totalBalance) * 100) : 0}% من إجمالي أموالك
          </div>
        </div>

        {/* سيولة ومصاريف يومية */}
        <div className="bg-[#111116] p-5 rounded-2xl border border-[#23232e] shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-sky-400" />
              <span>السيولة الحرة (مصاريف جارية)</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400">
              جاهزة للصرف
            </span>
          </div>
          <div className="my-2">
            <h2 className="text-2xl font-black text-white">{formatCurrency(liquidBalance)}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">الكاش النقدي، الحسابات الجارية، والمحافظ</p>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-[#23232e]">
            المتاحة للاستهلاك والمصروفات اليومية
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#23232e] pb-3">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-[#FFB50F] text-black shadow-md'
              : 'bg-[#181822] text-slate-400 hover:text-white border border-[#23232e]'
          }`}
        >
          جميع الحسابات ({accounts.length})
        </button>

        <button
          onClick={() => setFilterType('savings')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'savings'
              ? 'bg-[#FFB50F] text-black shadow-md'
              : 'bg-[#181822] text-slate-400 hover:text-white border border-[#23232e]'
          }`}
        >
          <PiggyBank className="w-3.5 h-3.5" />
          <span>شايل فلوس على جنب / مدخرات ({accounts.filter((a) => isSavingsAccountType(a.type)).length})</span>
        </button>

        <button
          onClick={() => setFilterType('liquid')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'liquid'
              ? 'bg-[#0F5FFF] text-white shadow-md'
              : 'bg-[#181822] text-slate-400 hover:text-white border border-[#23232e]'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>حسابات سيولة وصرف ({accounts.filter((a) => !isSavingsAccountType(a.type)).length})</span>
        </button>
      </div>

      {/* Accounts Grid */}
      {loading ? (
        <div className="p-12 flex items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2 text-[#FFB50F]" />
          <span className="text-sm">جاري تحميل الحسابات...</span>
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-[#111116] p-12 text-center rounded-2xl border border-[#23232e] text-slate-500 text-sm">
          لا توجد أي حسابات مسجلة بعد. اضغط على "إضافة حساب جديد" لإنشاء أول حساب.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((acc) => {
            const isSavings = isSavingsAccountType(acc.type);
            return (
              <div
                key={acc.id}
                className="bg-[#111116] p-5 rounded-2xl border border-[#23232e] shadow-lg hover:border-[#323242] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#181822] border border-[#23232e] flex items-center justify-center">
                      {getAccountIcon(acc.type)}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(acc)}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1f1f2d] transition-colors cursor-pointer"
                        title="تعديل"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(acc.id)}
                        className="text-slate-500 hover:text-[#FF0628] p-1.5 rounded-lg hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <h3 className="font-bold text-base text-white">{acc.name}</h3>
                    {isSavings ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFB50F]/20 text-[#FFB50F] border border-[#FFB50F]/30">
                        شايلها على جنب
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                        سيولة وصرف
                      </span>
                    )}
                  </div>
                  <span className="inline-block text-xs font-medium text-slate-400 mt-0.5">
                    {ACCOUNT_TYPES.find((t) => t.value === acc.type)?.label || acc.type}
                  </span>
                </div>

              <div className="mt-6 pt-3 border-t border-[#23232e] flex items-baseline justify-between">
                <span className="text-xs text-slate-400 font-medium">الرصيد:</span>
                <span className="text-lg font-black text-white">
                  {formatCurrency(acc.balance)}
                </span>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Modal Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111116] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#23232e] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#23232e] bg-[#161622]">
              <h3 className="font-bold text-white text-base">
                {editingAccount ? 'تعديل الحساب' : 'إضافة حساب جديد'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#23232e]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-950/50 text-red-300 text-xs rounded-xl border border-red-800/60">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الحساب</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: البنك الأهلي، محفظة كاش، الخزنة"
                  className="w-full text-sm px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">نوع الحساب</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF]"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-[#181822] text-white">
                      {t.label}
                    </option>
                  ))}
                </select>
                {isSavingsAccountType(type) ? (
                  <p className="text-[11px] text-[#FFB50F] mt-1.5 flex items-center gap-1">
                    <span>💡 هذا الحساب سيُصنف كـ <b>"أموال شايلها على جنب" (مدخرات وطوارئ)</b> ولن تُخلط مع مصاريفك اليومية.</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <span>💡 هذا الحساب مخصص للسيولة الجارية والمصروفات اليومية.</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  الرصيد الابتدائي (ج.م)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-lg font-bold px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] text-left dir-ltr"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm active:scale-98"
                  style={{
                    backgroundColor: '#FFB50F',
                    color: '#000000',
                    boxShadow: '0 2px 8px rgba(255, 181, 15, 0.4)',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>حفظ الحساب</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-slate-400 hover:text-white hover:bg-[#1f1f2d] rounded-xl text-sm font-medium transition-colors cursor-pointer border border-[#2e2e3e]"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

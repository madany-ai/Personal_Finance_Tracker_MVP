'use client';

import { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Loader2, PiggyBank } from 'lucide-react';
import { isSavingsAccountType } from '@/lib/constants';
import { invalidateClientCache } from '@/lib/client-cache';

interface Account {
  id: number;
  name: string;
  type: string;
  balance: string;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

interface QuickTransactionModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickTransactionModal({ onClose, onSuccess }: QuickTransactionModalProps) {
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [accRes, catRes] = await Promise.all([
          fetch('/api/accounts'),
          fetch('/api/categories'),
        ]);

        if (accRes.ok && catRes.ok) {
          const accs = await accRes.json();
          const cats = await catRes.json();
          setAccounts(accs);
          setCategories(cats);

          if (accs.length > 0) {
            setAccountId(accs[0].id.toString());
            if (accs.length > 1) {
              setToAccountId(accs[1].id.toString());
            }
          }
        }
      } catch (err) {
        console.error('Failed to load accounts/categories', err);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  const filteredCategories = categories.filter((c) => c.type === type);

  // Set default category when type or categories change
  useEffect(() => {
    if (filteredCategories.length > 0 && !categoryId) {
      setCategoryId(filteredCategories[0].id.toString());
    }
  }, [type, categories]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    if (!accountId) {
      setError('يرجى اختيار الحساب');
      return;
    }

    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) {
      setError('يرجى اختيار حساب محول إليه مختلف عن الحساب الأصلي');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: numAmount,
          accountId: parseInt(accountId),
          toAccountId: type === 'transfer' ? parseInt(toAccountId) : null,
          categoryId: type !== 'transfer' && categoryId ? parseInt(categoryId) : null,
          description: description || null,
          transactionDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء حفظ العملية');
        setSubmitting(false);
        return;
      }

      invalidateClientCache('/api/');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setError('فشل الاتصال بالخادم');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111116] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#23232e] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#23232e] bg-[#161622]">
          <h3 className="font-bold text-white text-base">تسجيل عملية مالية سريعة</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#23232e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Toggle Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-2 bg-[#181822] border border-[#23232e] m-4 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategoryId('');
            }}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer"
            style={
              type === 'expense'
                ? { backgroundColor: '#FF0628', color: '#ffffff', boxShadow: '0 2px 8px rgba(255, 6, 40, 0.35)' }
                : { color: '#94a3b8' }
            }
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>مصروف</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategoryId('');
            }}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer"
            style={
              type === 'income'
                ? { backgroundColor: '#0F5FFF', color: '#ffffff', boxShadow: '0 2px 8px rgba(15, 95, 255, 0.35)' }
                : { color: '#94a3b8' }
            }
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>دخل</span>
          </button>

          <button
            type="button"
            onClick={() => setType('transfer')}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer"
            style={
              type === 'transfer'
                ? { backgroundColor: '#000000', color: '#FFB50F', border: '1px solid #3b3b4d', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' }
                : { color: '#94a3b8' }
            }
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>تحويل</span>
          </button>
        </div>

        {error && (
          <div className="mx-6 p-3 bg-red-950/50 text-red-300 text-xs rounded-xl border border-red-800/60">
            {error}
          </div>
        )}

        {loadingData ? (
          <div className="p-8 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#FFB50F]" />
            <span className="mr-2 text-sm">جاري تحميل الحسابات...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">المبلغ (ج.م)</label>
              <input
                type="number"
                step="0.01"
                required
                autoFocus
                dir="ltr"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-2xl font-bold px-3 py-2.5 bg-[#181822] border border-[#2a2a38] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] transition-all text-left"
              />
            </div>

            {/* Account Selection */}
            {type === 'transfer' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">من حساب</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-[#181822] border border-[#2a2a38] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF]"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id} className="bg-[#181822] text-white">
                        {a.name} ({parseFloat(a.balance).toLocaleString('ar-EG')} ج.م)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">إلى حساب</label>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-[#181822] border border-[#2a2a38] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF]"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id} className="bg-[#181822] text-white">
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {(() => {
                const toAcc = accounts.find((a) => a.id.toString() === toAccountId);
                if (toAcc && isSavingsAccountType(toAcc.type)) {
                  return (
                    <div className="p-2.5 rounded-xl bg-[#FFB50F]/15 border border-[#FFB50F]/30 text-xs text-[#FFB50F] flex items-center gap-2 font-bold">
                      <PiggyBank className="w-4 h-4 shrink-0" />
                      <span>تحويل للادخار: سيتم حجز هذا المبلغ كـ "أموال شايلها على جنب" (مدخرات)!</span>
                    </div>
                  );
                }
                return null;
              })()}
            </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">الحساب</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-[#181822] border border-[#2a2a38] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF]"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id} className="bg-[#181822] text-white">
                        {a.name} ({parseFloat(a.balance).toLocaleString('ar-EG')} ج.م)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">التصنيف</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-[#181822] border border-[#2a2a38] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF]"
                  >
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#181822] text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Date and Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">تاريخ العملية</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full text-sm px-3 py-2.5 bg-[#181822] border border-[#2a2a38] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الوصف (اختياري)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: غداء عمل، شحن هاتف"
                rows={2}
                className="w-full text-sm px-3 py-2.5 bg-[#181822] border border-[#2a2a38] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] placeholder-slate-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm active:scale-98"
                style={{
                  backgroundColor: '#FFB50F',
                  color: '#000000',
                  boxShadow: '0 2px 12px rgba(255, 181, 15, 0.4)',
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <span>حفظ العملية</span>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-400 hover:text-white hover:bg-[#1f1f2b] rounded-xl text-sm font-medium transition-colors cursor-pointer border border-[#2a2a38]"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

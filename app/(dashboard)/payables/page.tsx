'use client';

import { useState, useEffect } from 'react';
import { Receipt, Plus, CheckCircle2, Trash2, Loader2, X, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PayablesPage() {
  const [payables, setPayables] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [personName, setPersonName] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  // Pay Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState('');

  async function loadData() {
    try {
      const [pRes, aRes] = await Promise.all([
        fetch('/api/payables'),
        fetch('/api/accounts'),
      ]);
      if (pRes.ok && aRes.ok) {
        setPayables(await pRes.json());
        const accs = await aRes.json();
        setAccounts(accs);
        if (accs.length > 0) setSourceAccountId(accs[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/payables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personName,
          originalAmount: parseFloat(originalAmount) || 0,
          description,
          dueDate: dueDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'حدث خطأ أثناء الإضافة');
        setSubmitting(false);
        return;
      }

      setShowAddModal(false);
      setPersonName('');
      setOriginalAmount('');
      setDescription('');
      setDueDate('');
      loadData();
    } catch (err) {
      console.error(err);
      setAddError('فشل الاتصال بالخادم');
    } finally {
      setSubmitting(false);
    }
  }

  function openPay(pay: any) {
    setSelectedPayable(pay);
    setPayAmount(pay.remainingAmount);
    setPayError('');
    setShowPayModal(true);
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPayable) return;
    setPayError('');
    setPaySubmitting(true);

    try {
      const res = await fetch(`/api/payables/${selectedPayable.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay',
          amount: parseFloat(payAmount) || 0,
          accountId: sourceAccountId ? parseInt(sourceAccountId) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error || 'حدث خطأ أثناء تسجيل السداد');
        setPaySubmitting(false);
        return;
      }

      setShowPayModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      setPayError('فشل الاتصال بالخادم');
    } finally {
      setPaySubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الالتزام؟')) return;
    try {
      const res = await fetch(`/api/payables/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  }

  const totalRemaining = payables
    .filter((p) => p.status !== 'تم السداد')
    .reduce((sum, p) => sum + parseFloat(p.remainingAmount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111116] p-5 rounded-2xl border border-[#23232e] shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#181822] border border-[#272736] flex items-center justify-center text-[#FFB50F] shrink-0 shadow-md">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">عليّ للآخرين (ديون والتزامات)</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              متابعة المبالغ التي اقترضتها أو الالتزامات المالية الواجب سدادها للآخرين
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-sm active:scale-98"
          style={{
            backgroundColor: '#FFB50F',
            color: '#000000',
            boxShadow: '0 2px 8px rgba(255, 181, 15, 0.4)',
          }}
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل التزام جديد</span>
        </button>
      </div>

      {/* Hero Banner with Rule */}
      <div className="bg-[#240b10] border border-[#FF0628]/40 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-xs font-semibold text-red-200">إجمالي الالتزامات غير المسددة عليك</span>
          <h2 className="text-2xl font-black mt-0.5" style={{ color: '#FF0628' }}>
            {formatCurrency(totalRemaining)}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-red-200 bg-[#3d121b]/80 px-3.5 py-2 rounded-xl border border-[#FF0628]/30">
          <AlertCircle className="w-4 h-4 text-[#FFB50F] shrink-0" />
          <span>قاعدة: الدين لا يقلل رصيدك البنكي الحالي تلقائيًا؛ يتم الخصم عند دفعه فعليًا.</span>
        </div>
      </div>

      {/* Payables List */}
      <div className="bg-[#111116] rounded-2xl border border-[#23232e] shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2 text-[#FFB50F]" />
            <span className="text-sm">جاري تحميل البيانات...</span>
          </div>
        ) : payables.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            🎉 ليس عليك أي التزامات أو ديون مسجلة حاليًا!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-[#161622] border-b border-[#23232e] text-slate-400 text-xs font-semibold">
                <tr>
                  <th className="py-3.5 px-4">الشخص / الجهة</th>
                  <th className="py-3.5 px-4">المبلغ الأصلي</th>
                  <th className="py-3.5 px-4">المدفوع</th>
                  <th className="py-3.5 px-4">المتبقي</th>
                  <th className="py-3.5 px-4">تاريخ الاستحقاق</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23232e]">
                {payables.map((p) => {
                  const isSettled = p.status === 'تم السداد';
                  return (
                    <tr key={p.id} className="hover:bg-[#161622]/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {p.personName}
                        {p.description && (
                          <span className="block text-xs text-slate-400 font-normal">
                            {p.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-300">
                        {formatCurrency(p.originalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-[#0F5FFF] font-semibold">
                        {formatCurrency(p.paidAmount)}
                      </td>
                      <td className="py-3.5 px-4 font-black" style={{ color: '#FF0628' }}>
                        {formatCurrency(p.remainingAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {formatDate(p.dueDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isSettled
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                              : p.status === 'مدفوع جزئيًا'
                              ? 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
                              : p.status === 'متأخر'
                              ? 'bg-red-950/60 text-red-300 border border-red-800/60'
                              : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isSettled && (
                            <button
                              onClick={() => openPay(p)}
                              className="flex items-center gap-1 bg-[#FF0628]/20 hover:bg-[#FF0628]/30 text-[#FF0628] border border-[#FF0628]/40 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>سداد</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-slate-500 hover:text-[#FF0628] p-1.5 rounded-lg hover:bg-red-950/40 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111116] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#23232e]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#23232e] bg-[#161622]">
              <h3 className="font-bold text-white text-base">تسجيل التزام أو دين عليك</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#23232e]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mx-6 mt-4 p-3 bg-red-950/50 text-red-300 text-xs rounded-xl border border-red-800/60">
                {addError}
              </div>
            )}

            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الشخص أو الجهة</label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="مثال: محمد، متجر الإلكترونيات، فواتير قديمة"
                  className="w-full text-sm px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">المبلغ الإجمالي (ج.م)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={originalAmount}
                  onChange={(e) => setOriginalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-lg font-bold px-3 py-2.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] text-left dir-ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">تاريخ الاستحقاق المطلوب</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الوصف / تفاصيل</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ملاحظات حول الالتزام"
                  className="w-full text-sm px-3 py-2 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] placeholder-slate-500"
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
                    <span>حفظ الالتزام</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-slate-400 hover:text-white hover:bg-[#1f1f2d] rounded-xl text-sm font-medium transition-colors cursor-pointer border border-[#2e2e3e]"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && selectedPayable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111116] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#23232e]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#23232e] bg-[#161622]">
              <h3 className="font-bold text-white text-base">
                سداد دفعة لـ: {selectedPayable.personName}
              </h3>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#23232e]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {payError && (
              <div className="mx-6 mt-4 p-3 bg-red-950/50 text-red-300 text-xs rounded-xl border border-red-800/60">
                {payError}
              </div>
            )}

            <form onSubmit={handlePay} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  المبلغ المدفوع الآن (ج.م)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full text-xl font-bold px-3 py-2 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl text-left dir-ltr focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF]"
                />
                <span className="text-xs text-slate-400 mt-1 block">
                  إجمالي المتبقي عليك: {formatCurrency(selectedPayable.remainingAmount)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  الحساب المراد خصم المبلغ منه (اختياري)
                </label>
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF]"
                >
                  <option value="" className="bg-[#181822]">بدون خصم من حساب تلقائي</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} className="bg-[#181822]">
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-400 mt-1 block">
                  عند اختيار حساب، سيتم تسجيل عملية مصروف وخصم الرصيد منه تلقائيًا.
                </span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="flex-1 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm active:scale-98"
                  style={{
                    backgroundColor: '#FFB50F',
                    color: '#000000',
                    boxShadow: '0 2px 8px rgba(255, 181, 15, 0.4)',
                  }}
                >
                  {paySubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري السداد...</span>
                    </>
                  ) : (
                    <span>تأكيد السداد</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
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

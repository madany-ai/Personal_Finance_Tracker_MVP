'use client';

import { useState, useEffect } from 'react';
import { CalendarClock, Plus, CheckCircle2, Trash2, Loader2, X, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { INSTALLMENT_FREQUENCIES } from '@/lib/constants';

export default function InstallmentsPage() {
  const [installments, setInstallments] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [entity, setEntity] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installmentCount, setInstallmentCount] = useState('');
  const [firstDate, setFirstDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextDate, setNextDate] = useState(new Date().toISOString().split('T')[0]);
  const [frequency, setFrequency] = useState('شهري');
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  // Pay Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInst, setSelectedInst] = useState<any>(null);
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState('');

  async function loadData() {
    try {
      const [iRes, aRes] = await Promise.all([
        fetch('/api/installments'),
        fetch('/api/accounts'),
      ]);
      if (iRes.ok && aRes.ok) {
        setInstallments(await iRes.json());
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

    const total = parseFloat(totalAmount);
    const count = parseInt(installmentCount);
    if (isNaN(total) || total <= 0 || isNaN(count) || count <= 0) {
      setAddError('يرجى إدخال مبلغ صحيح وعدد أقساط صحيح');
      return;
    }

    const installmentAmount = total / count;
    setSubmitting(true);

    try {
      const res = await fetch('/api/installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          entity,
          totalAmount: total,
          installmentCount: count,
          installmentAmount,
          firstDate,
          nextDate,
          frequency,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'حدث خطأ أثناء حفظ القسط');
        setSubmitting(false);
        return;
      }

      setShowAddModal(false);
      setName('');
      setEntity('');
      setTotalAmount('');
      setInstallmentCount('');
      loadData();
    } catch (err) {
      console.error(err);
      setAddError('فشل الاتصال بالخادم');
    } finally {
      setSubmitting(false);
    }
  }

  function openPay(inst: any) {
    setSelectedInst(inst);
    setPayError('');
    setShowPayModal(true);
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInst) return;
    setPayError('');
    setPaySubmitting(true);

    try {
      const res = await fetch(`/api/installments/${selectedInst.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay_installment',
          accountId: sourceAccountId ? parseInt(sourceAccountId) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error || 'فشل تسجيل دفع القسط');
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
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا القسط؟')) return;
    try {
      const res = await fetch(`/api/installments/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  }

  const activeInstallments = installments.filter((i) => i.status === 'نشط');
  const totalRemaining = activeInstallments.reduce((sum, i) => sum + parseFloat(i.remainingAmount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111116] p-5 rounded-2xl border border-[#23232e] shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#181822] border border-[#272736] flex items-center justify-center text-[#FFB50F] shrink-0 shadow-md">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">الأقساط والالتزامات المقسطة</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              متابعة الأقساط، المدفوع، المتبقي، وتواريخ الاستحقاق القادمة
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
          <span>إضافة قسط جديد</span>
        </button>
      </div>

      {/* Summary Card */}
      <div
        className="text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#0F5FFF]/40"
        style={{
          background: 'linear-gradient(135deg, #093ca8 0%, #061c52 100%)',
          boxShadow: '0 8px 24px rgba(15, 95, 255, 0.25)',
        }}
      >
        <div>
          <span className="text-xs font-semibold text-blue-200 uppercase">إجمالي الأقساط المتبقية عليك</span>
          <h2 className="text-2xl sm:text-3xl font-black mt-1 text-white" style={{ color: '#FFB50F' }}>
            {formatCurrency(totalRemaining)}
          </h2>
        </div>
        <div className="text-xs text-blue-200 space-y-1">
          <div>الأقساط النشطة: {activeInstallments.length}</div>
          <div>المكتملة: {installments.filter((i) => i.status === 'مكتمل').length}</div>
        </div>
      </div>

      {/* Installments Grid */}
      {loading ? (
        <div className="p-12 flex items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2 text-[#FFB50F]" />
          <span className="text-sm">جاري تحميل الأقساط...</span>
        </div>
      ) : installments.length === 0 ? (
        <div className="bg-[#111116] p-12 text-center rounded-2xl border border-[#23232e] text-slate-500 text-sm">
          🎉 ليس لديك أي أقساط مسجلة حاليًا!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {installments.map((inst) => {
            const isCompleted = inst.status === 'مكتمل';
            const progress = Math.min(
              100,
              Math.round((inst.paidCount / inst.installmentCount) * 100)
            );
            return (
              <div
                key={inst.id}
                className="bg-[#111116] p-5 rounded-2xl border border-[#23232e] shadow-lg hover:border-[#323242] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isCompleted
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                          : 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
                      }`}
                    >
                      {inst.status}
                    </span>
                    <button
                      onClick={() => handleDelete(inst.id)}
                      className="text-slate-500 hover:text-[#FF0628] p-1.5 rounded-lg hover:bg-red-950/40 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-white mt-2">{inst.name}</h3>
                  {inst.entity && (
                    <span className="block text-xs text-slate-400 mt-0.5">الجهة: {inst.entity}</span>
                  )}

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
                      <span>المدفوع: {inst.paidCount} من {inst.installmentCount}</span>
                      <span className="text-white font-bold">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#1f1f2e] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: isCompleted ? '#10b981' : '#0F5FFF',
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Key Details */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#181822] p-2.5 rounded-xl border border-[#23232e]">
                      <span className="text-slate-400 block mb-0.5">قيمة القسط</span>
                      <span className="font-bold text-white">
                        {formatCurrency(inst.installmentAmount)}
                      </span>
                    </div>
                    <div className="bg-[#181822] p-2.5 rounded-xl border border-[#23232e]">
                      <span className="text-slate-400 block mb-0.5">المتبقي</span>
                      <span className="font-bold" style={{ color: '#FF0628' }}>
                        {formatCurrency(inst.remainingAmount)}
                      </span>
                    </div>
                  </div>

                  {!isCompleted && (
                    <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5 text-[#0F5FFF] shrink-0" />
                      <span>القسط القادم: <b className="text-white">{formatDate(inst.nextDate)}</b></span>
                    </div>
                  )}
                </div>

                {/* Pay Button */}
                <div className="mt-5 pt-3 border-t border-[#23232e]">
                  {isCompleted ? (
                    <div className="text-center text-xs font-semibold text-emerald-400 py-2 bg-emerald-950/40 border border-emerald-800/40 rounded-xl">
                      ✓ اكتمل سداد جميع الأقساط
                    </div>
                  ) : (
                    <button
                      onClick={() => openPay(inst)}
                      className="w-full flex items-center justify-center gap-2 font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer active:scale-98"
                      style={{
                        backgroundColor: '#FFB50F',
                        color: '#000000',
                        boxShadow: '0 2px 8px rgba(255, 181, 15, 0.4)',
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>دفع القسط الحالي ({formatCurrency(inst.installmentAmount)})</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111116] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#23232e]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#23232e] bg-[#161622]">
              <h3 className="font-bold text-white text-base">إضافة قسط جديد</h3>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم السلعة أو القسط</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: لابتوب، هاتف، أجهزة منزلية"
                  className="w-full text-sm px-3 py-2 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الجهة / المتجر (اختياري)</label>
                <input
                  type="text"
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  placeholder="مثال: بي تك، أمازون، البنك"
                  className="w-full text-sm px-3 py-2 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">إجمالي المبلغ (ج.م)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="12000"
                    className="w-full text-sm font-bold px-3 py-2 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] text-left dir-ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">عدد الأقساط</label>
                  <input
                    type="number"
                    required
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(e.target.value)}
                    placeholder="12"
                    className="w-full text-sm font-bold px-3 py-2 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF] text-left dir-ltr"
                  />
                </div>
              </div>

              {totalAmount && installmentCount && (
                <div className="p-2.5 bg-[#0b1b36] border border-[#0F5FFF]/40 rounded-xl text-xs text-blue-200 font-medium text-center">
                  قيمة القسط الواحد: <b>{formatCurrency(parseFloat(totalAmount) / parseInt(installmentCount))}</b>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">تاريخ أول قسط</label>
                  <input
                    type="date"
                    required
                    value={firstDate}
                    onChange={(e) => {
                      setFirstDate(e.target.value);
                      setNextDate(e.target.value);
                    }}
                    className="w-full text-sm px-3 py-2 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">تكرار القسط</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-[#181822] border border-[#2e2e3e] text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F5FFF]"
                  >
                    {INSTALLMENT_FREQUENCIES.map((f) => (
                      <option key={f.value} value={f.value} className="bg-[#181822] text-white">
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
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
                    <span>حفظ القسط</span>
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
      {showPayModal && selectedInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111116] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#23232e]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#23232e] bg-[#161622]">
              <h3 className="font-bold text-white text-base">
                دفع قسط: {selectedInst.name}
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
              <div className="p-4 bg-[#181822] rounded-xl border border-[#23232e] space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>قيمة القسط:</span>
                  <span className="text-base font-bold text-white">
                    {formatCurrency(selectedInst.installmentAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>رقم القسط:</span>
                  <span className="font-semibold text-slate-200">
                    رقم {selectedInst.paidCount + 1} من {selectedInst.installmentCount}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  الحساب المراد خصم القسط منه (اختياري)
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
                      <span>جاري الخصم...</span>
                    </>
                  ) : (
                    <span>تأكيد دفع القسط</span>
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

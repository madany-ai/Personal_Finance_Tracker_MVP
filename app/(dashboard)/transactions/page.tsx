'use client';

import { useState, useEffect } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  Trash2,
  Loader2,
  Filter,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import QuickTransactionModal from '@/components/dashboard/QuickTransactionModal';
import { fetchWithClientCache, invalidateClientCache } from '@/lib/client-cache';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');

  async function loadData(forceRefresh = false) {
    try {
      const [txList, accList] = await Promise.all([
        fetchWithClientCache<any[]>('/api/transactions', { forceRefresh }),
        fetchWithClientCache<any[]>('/api/accounts', { forceRefresh }),
      ]);
      setTransactions(txList);
      setAccounts(accList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذه العملية؟ سيتم استرجاع الرصيد في الحساب.')) {
      return;
    }

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        invalidateClientCache('/api/');
        loadData(true);
      } else {
        alert('حدث خطأ أثناء حذف العملية');
      }
    } catch (err) {
      console.error(err);
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (accountFilter !== 'all' && t.accountId !== parseInt(accountFilter)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111116] p-5 rounded-2xl border border-[#23232e] shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white">سجل العمليات المالية</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            عرض وتصفية جميع عمليات الدخل والمصروف والتحويل
          </p>
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
          <span>إضافة عملية جديدة</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#111116] p-4 rounded-xl border border-[#23232e] flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Filter className="w-4 h-4 text-[#0F5FFF]" />
          <span>تصفية:</span>
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs px-3 py-1.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#0F5FFF]"
        >
          <option value="all" className="bg-[#181822]">كل الأنواع</option>
          <option value="expense" className="bg-[#181822]">المصروفات فقط</option>
          <option value="income" className="bg-[#181822]">الدخل فقط</option>
          <option value="transfer" className="bg-[#181822]">التحويلات فقط</option>
        </select>

        {/* Account Filter */}
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="text-xs px-3 py-1.5 bg-[#181822] border border-[#2e2e3e] text-white rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#0F5FFF]"
        >
          <option value="all" className="bg-[#181822]">كل الحسابات</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id} className="bg-[#181822]">
              {a.name}
            </option>
          ))}
        </select>

        <span className="text-xs text-slate-400 mr-auto">
          العدد: {filteredTransactions.length} عملية
        </span>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-[#111116] rounded-2xl border border-[#23232e] overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2 text-[#FFB50F]" />
            <span className="text-sm">جاري تحميل العمليات...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            لا توجد عمليات تطابق التصفية الحالية
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-[#161622] border-b border-[#23232e] text-slate-400 text-xs font-semibold">
                <tr>
                  <th className="py-3.5 px-4">النوع</th>
                  <th className="py-3.5 px-4">المبلغ</th>
                  <th className="py-3.5 px-4">الوصف</th>
                  <th className="py-3.5 px-4">التصنيف</th>
                  <th className="py-3.5 px-4">الحساب</th>
                  <th className="py-3.5 px-4">تاريخ العملية</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23232e]">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const isExpense = tx.type === 'expense';
                  return (
                    <tr key={tx.id} className="hover:bg-[#161622]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs"
                            style={{
                              backgroundColor: isIncome ? '#0F5FFF' : isExpense ? '#FF0628' : '#1e1e2c',
                            }}
                          >
                            {isIncome && <ArrowUpRight className="w-4 h-4" />}
                            {isExpense && <ArrowDownRight className="w-4 h-4" />}
                            {!isIncome && !isExpense && <ArrowLeftRight className="w-3.5 h-3.5 text-[#FFB50F]" />}
                          </div>
                          <span className="font-semibold text-xs text-slate-300">
                            {isIncome ? 'دخل' : isExpense ? 'مصروف' : 'تحويل'}
                          </span>
                        </div>
                      </td>

                      <td
                        className="py-3.5 px-4 font-bold"
                        style={{
                          color: isIncome ? '#0F5FFF' : isExpense ? '#FF0628' : '#FFB50F',
                        }}
                      >
                        {isIncome ? '+' : isExpense ? '-' : ''}
                        {formatCurrency(tx.amount)}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-white">
                        {tx.description || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 text-xs">
                        {tx.category?.name ? (
                          <span className="px-2 py-1 bg-[#1a1a26] border border-[#2e2e3e] rounded-md font-medium text-slate-300">
                            {tx.category.name}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 text-xs">
                        {tx.type === 'transfer' ? (
                          <span className="font-medium">
                            {tx.account?.name} ← {tx.toAccount?.name}
                          </span>
                        ) : (
                          <span className="font-medium">{tx.account?.name}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {formatDate(tx.transactionDate)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="text-slate-500 hover:text-[#FF0628] p-1.5 rounded-lg hover:bg-red-950/40 transition-colors"
                          title="حذف واسترجاع الرصيد"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <QuickTransactionModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            invalidateClientCache('/api/');
            loadData(true);
          }}
        />
      )}
    </div>
  );
}

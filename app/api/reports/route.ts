import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  accounts,
  transactions,
  receivables,
  payables,
  installments,
  expectedIncome,
} from '@/db/schema';
import { getCurrentUser } from '@/lib/session';
import { eq, and, sql, desc } from 'drizzle-orm';
import { calculateSavingsRate } from '@/lib/calculations';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month'; // 'day' | 'week' | 'month' | 'custom'
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    if (period === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Month (default)
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 1. Transactions in period
    const periodTransactions = await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, user.id),
        sql`${transactions.transactionDate} >= ${startDate.toISOString()}`,
        sql`${transactions.transactionDate} <= ${endDate.toISOString()}`
      ),
      with: {
        account: true,
        toAccount: true,
        category: true,
      },
      orderBy: [desc(transactions.transactionDate), desc(transactions.createdAt)],
    });

    let totalIncome = 0;
    let totalExpense = 0;
    let largestExpense = 0;
    const categoryExpenses: Record<string, number> = {};
    const dailySpending: Record<string, number> = {};

    for (const t of periodTransactions) {
      const amt = parseFloat(t.amount);
      if (t.type === 'income') {
        totalIncome += amt;
      } else if (t.type === 'expense') {
        totalExpense += amt;
        if (amt > largestExpense) largestExpense = amt;

        const cat = t.category?.name || 'أخرى';
        categoryExpenses[cat] = (categoryExpenses[cat] || 0) + amt;

        const dayKey = new Date(t.transactionDate).toISOString().split('T')[0];
        dailySpending[dayKey] = (dailySpending[dayKey] || 0) + amt;
      }
    }

    const net = totalIncome - totalExpense;
    const savingsRate = calculateSavingsRate(totalIncome, net);

    // Days count for average calculation
    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyAverage = Math.round((totalExpense / daysDiff) * 100) / 100;

    // Top spending days
    const topSpendingDays = Object.entries(dailySpending)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Category breakdown sorted
    const categoryBreakdown = Object.entries(categoryExpenses)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Accounts current balance
    const userAccounts = await db.query.accounts.findMany({
      where: eq(accounts.userId, user.id),
    });
    const currentBalance = userAccounts.reduce((sum, a) => sum + parseFloat(a.balance), 0);

    // Receivables & Payables & Installments overview
    const userReceivables = await db.query.receivables.findMany({
      where: and(eq(receivables.userId, user.id), sql`${receivables.status} != 'تم التحصيل'`),
    });
    const totalReceivables = userReceivables.reduce((sum, r) => sum + parseFloat(r.remainingAmount), 0);

    const userPayables = await db.query.payables.findMany({
      where: and(eq(payables.userId, user.id), sql`${payables.status} != 'تم السداد'`),
    });
    const totalPayables = userPayables.reduce((sum, p) => sum + parseFloat(p.remainingAmount), 0);

    const activeInstallments = await db.query.installments.findMany({
      where: eq(installments.userId, user.id),
    });

    const totalInstallmentsPaid = activeInstallments.reduce((sum, i) => sum + parseFloat(i.paidAmount), 0);
    const totalInstallmentsRemaining = activeInstallments.reduce(
      (sum, i) => sum + parseFloat(i.remainingAmount),
      0
    );

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      currency: user.currency || 'ج.م',
      summary: {
        totalIncome,
        totalExpense,
        net,
        savingsRate,
        dailyAverage,
        largestExpense,
        currentBalance,
        totalReceivables,
        totalPayables,
        totalInstallmentsPaid,
        totalInstallmentsRemaining,
      },
      categoryBreakdown,
      topSpendingDays,
      transactions: periodTransactions,
    });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'خطأ أثناء توليد التقرير' }, { status: 500 });
  }
}

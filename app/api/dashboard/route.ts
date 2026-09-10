import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  accounts,
  transactions,
  receivables,
  payables,
  installments,
  expectedIncome,
  recurringExpenses,
} from '@/db/schema';
import { getCurrentUser } from '@/lib/session';
import { eq, and, sql, desc, asc } from 'drizzle-orm';
import { calculateSavingsRate, calculateNetWorth } from '@/lib/calculations';
import { isSavingsAccountType } from '@/lib/constants';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const now = new Date();

    // 1. حسابات وأرصدة فعلية
    const userAccounts = await db.query.accounts.findMany({
      where: eq(accounts.userId, user.id),
      orderBy: [desc(accounts.balance)],
    });

    let currentBalance = 0;
    let savedBalance = 0;
    let liquidBalance = 0;

    for (const a of userAccounts) {
      const bal = parseFloat(a.balance);
      currentBalance += bal;
      if (isSavingsAccountType(a.type)) {
        savedBalance += bal;
      } else {
        liquidBalance += bal;
      }
    }

    // 2. عمليات اليوم
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayTransactions = await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, user.id),
        sql`${transactions.transactionDate} >= ${startOfToday.toISOString()}`
      ),
    });

    let todayIncome = 0;
    let todayExpense = 0;
    for (const t of todayTransactions) {
      const amt = parseFloat(t.amount);
      if (t.type === 'income') todayIncome += amt;
      if (t.type === 'expense') todayExpense += amt;
    }
    const todayNet = todayIncome - todayExpense;

    // 3. عمليات الشهر
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTransactions = await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, user.id),
        sql`${transactions.transactionDate} >= ${startOfMonth.toISOString()}`
      ),
      with: { category: true },
    });

    let monthIncome = 0;
    let monthExpense = 0;
    const categorySpending: Record<string, number> = {};

    for (const t of monthTransactions) {
      const amt = parseFloat(t.amount);
      if (t.type === 'income') monthIncome += amt;
      if (t.type === 'expense') {
        monthExpense += amt;
        const catName = t.category?.name || 'أخرى';
        categorySpending[catName] = (categorySpending[catName] || 0) + amt;
      }
    }

    const monthSavings = monthIncome - monthExpense;
    const savingsRate = calculateSavingsRate(monthIncome, monthSavings);

    // 4. لي عند الآخرين (المبالغ المتبقية)
    const userReceivables = await db.query.receivables.findMany({
      where: and(eq(receivables.userId, user.id), sql`${receivables.status} != 'تم التحصيل'`),
    });
    const totalReceivables = userReceivables.reduce((sum, r) => sum + parseFloat(r.remainingAmount), 0);

    // 5. عليّ للآخرين (المبالغ المتبقية)
    const userPayables = await db.query.payables.findMany({
      where: and(eq(payables.userId, user.id), sql`${payables.status} != 'تم السداد'`),
    });
    const totalPayables = userPayables.reduce((sum, p) => sum + parseFloat(p.remainingAmount), 0);

    // 6. صافي الوضع المالي الحقيقي
    const netWorth = calculateNetWorth(currentBalance, totalReceivables, totalPayables);

    // 7. الالتزامات القادمة (أقساط نشطة + مصاريف متكررة مرتبة حسب الأقرب)
    const activeInstallments = await db.query.installments.findMany({
      where: and(eq(installments.userId, user.id), eq(installments.status, 'نشط')),
      orderBy: [asc(installments.nextDate)],
      limit: 5,
    });

    const activeRecurring = await db.query.recurringExpenses.findMany({
      where: and(eq(recurringExpenses.userId, user.id), eq(recurringExpenses.status, 'نشط')),
      orderBy: [asc(recurringExpenses.nextDueDate)],
      limit: 5,
    });

    const upcomingCommitments = [
      ...activeInstallments.map((i) => ({
        id: `inst-${i.id}`,
        title: `قسط ${i.name}`,
        amount: parseFloat(i.installmentAmount),
        dueDate: i.nextDate,
        type: 'قسط',
        details: `متبقي ${i.remainingCount} قسط (${i.remainingAmount} ${user.currency})`,
      })),
      ...activeRecurring.map((r) => ({
        id: `rec-${r.id}`,
        title: r.name,
        amount: parseFloat(r.amount),
        dueDate: r.nextDueDate,
        type: 'مصروف متكرر',
        details: `تكرار: ${r.frequency}`,
      })),
      ...userPayables.map((p) => ({
        id: `pay-${p.id}`,
        title: `دين: ${p.personName}`,
        amount: parseFloat(p.remainingAmount),
        dueDate: p.dueDate || new Date().toISOString(),
        type: 'دين',
        details: p.description || 'دين/التزام مستحق',
      })),
    ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // 8. الدخل المتوقع القادم
    const pendingExpectedIncome = await db.query.expectedIncome.findMany({
      where: and(eq(expectedIncome.userId, user.id), sql`${expectedIncome.status} != 'وصل'`),
      orderBy: [asc(expectedIncome.expectedDate)],
      limit: 5,
    });

    const totalExpectedIncome = pendingExpectedIncome.reduce(
      (sum, e) => sum + parseFloat(e.amount),
      0
    );

    // 9. آخر العمليات
    const recentTransactions = await db.query.transactions.findMany({
      where: eq(transactions.userId, user.id),
      with: {
        account: true,
        toAccount: true,
        category: true,
      },
      orderBy: [desc(transactions.transactionDate), desc(transactions.createdAt)],
      limit: 8,
    });

    // 10. توزيع المصروفات للشارت
    const categoryChartData = Object.entries(categorySpending).map(([name, value]) => ({
      name,
      value,
    }));

    return NextResponse.json({
      metrics: {
        currentBalance,
        liquidBalance,
        savedBalance,
        targetSavingsRate: user.targetSavingsRate ?? 20,
        monthlySavingsGoal: user.monthlySavingsGoal ? parseFloat(user.monthlySavingsGoal) : 0,
        todayIncome,
        todayExpense,
        todayNet,
        monthIncome,
        monthExpense,
        monthSavings,
        savingsRate,
        totalReceivables,
        totalPayables,
        netWorth,
        totalExpectedIncome,
        currency: user.currency || 'ج.م',
      },
      accounts: userAccounts,
      upcomingCommitments,
      expectedIncome: pendingExpectedIncome,
      recentTransactions,
      categorySpending: categoryChartData,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'خطأ أثناء جلب بيانات لوحة التحكم' }, { status: 500 });
  }
}

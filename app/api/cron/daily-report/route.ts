import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, accounts, transactions, receivables, payables } from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { sendTelegramMessage } from '@/lib/telegram';

export async function GET(req: NextRequest) {
  try {
    // Check authorization header if CRON_SECRET is set
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow Vercel Cron native requests
      const isVercelCron = req.headers.get('user-agent')?.includes('vercel-cron');
      if (!isVercelCron) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const allUsers = await db.query.users.findMany();
    for (const user of allUsers) {
      if (!user.telegramBotToken || !user.telegramChatId) continue;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. حسابات الدخل والمصروف اليوم
      const todayTrans = await db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, user.id),
          sql`${transactions.transactionDate} >= ${today.toISOString()}`
        ),
        with: { category: true },
        orderBy: [desc(transactions.amount)],
      });

      let income = 0;
      let expenses = 0;
      const categoryExpenses: Record<string, number> = {};

      for (const t of todayTrans) {
        const amt = parseFloat(t.amount);
        if (t.type === 'income') income += amt;
        if (t.type === 'expense') {
          expenses += amt;
          const catName = t.category?.name || 'أخرى';
          categoryExpenses[catName] = (categoryExpenses[catName] || 0) + amt;
        }
      }

      const net = income - expenses;

      // 2. إجمالي الرصيد الفعلي
      const userAccounts = await db.query.accounts.findMany({
        where: eq(accounts.userId, user.id),
      });
      const currentBalance = userAccounts.reduce((sum, a) => sum + parseFloat(a.balance), 0);

      // 3. الديون
      const userReceivables = await db.query.receivables.findMany({
        where: and(eq(receivables.userId, user.id), sql`${receivables.status} != 'تم التحصيل'`),
      });
      const totalReceivables = userReceivables.reduce((sum, r) => sum + parseFloat(r.remainingAmount), 0);

      const userPayables = await db.query.payables.findMany({
        where: and(eq(payables.userId, user.id), sql`${payables.status} != 'تم السداد'`),
      });
      const totalPayables = userPayables.reduce((sum, p) => sum + parseFloat(p.remainingAmount), 0);

      // إنشاء نص التقرير (طِبقًا للـ PRD البند 19)
      let report = `📊 <b>التقرير المالي اليومي</b>\n`;
      report += `📅 ${formatDate(new Date())}\n\n`;
      report += `• <b>الدخل:</b> +${formatCurrency(income, user.currency)}\n`;
      report += `• <b>المصروفات:</b> -${formatCurrency(expenses, user.currency)}\n`;
      report += `• <b>الصافي:</b> ${net >= 0 ? '+' : ''}${formatCurrency(net, user.currency)}\n\n`;

      const sortedCategories = Object.entries(categoryExpenses)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      if (sortedCategories.length > 0) {
        report += `<b>أعلى المصروفات اليوم:</b>\n`;
        for (const [cat, amt] of sortedCategories) {
          report += `  - ${cat}: ${formatCurrency(amt, user.currency)}\n`;
        }
        report += `\n`;
      }

      report += `💵 <b>الرصيد الفعلي الحالي:</b>\n${formatCurrency(currentBalance, user.currency)}\n\n`;
      report += `📤 <b>عليك للآخرين:</b> ${formatCurrency(totalPayables, user.currency)}\n`;
      report += `📥 <b>لك عند الآخرين:</b> ${formatCurrency(totalReceivables, user.currency)}`;

      await sendTelegramMessage(user.telegramBotToken, user.telegramChatId, report);
    }

    return NextResponse.json({ success: true, message: 'Daily reports dispatched' });
  } catch (error) {
    console.error('Daily report cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, installments, payables, receivables, expectedIncome } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { sendTelegramMessage } from '@/lib/telegram';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const isVercelCron = req.headers.get('user-agent')?.includes('vercel-cron');
      if (!isVercelCron) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const allUsers = await db.query.users.findMany();
    for (const user of allUsers) {
      if (!user.telegramBotToken || !user.telegramChatId) continue;

      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);

      // 1. أقساط مستحقة خلال 24-48 ساعة
      const upcomingInstallments = await db.query.installments.findMany({
        where: and(
          eq(installments.userId, user.id),
          eq(installments.status, 'نشط')
        ),
      });

      for (const inst of upcomingInstallments) {
        const nextDate = new Date(inst.nextDate);
        const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 2) {
          const alertMsg = `⏰ <b>تنبيه موعد قسط</b>\n\n` +
            `موعد قسط <b>${inst.name}</b> ${diffDays === 0 ? 'اليوم' : diffDays === 1 ? 'غدًا' : 'خلال يومين'}.\n` +
            `• قيمة القسط: <b>${formatCurrency(inst.installmentAmount, user.currency)}</b>\n` +
            `• المتبقي من إجمالي الأقساط: <b>${formatCurrency(inst.remainingAmount, user.currency)}</b>\n` +
            `• تاريخ الاستحقاق: ${formatDate(inst.nextDate)}`;

          await sendTelegramMessage(user.telegramBotToken, user.telegramChatId, alertMsg);
        }
      }

      // 2. ديون عليك مستحقة غداً أو متأخرة
      const userPayables = await db.query.payables.findMany({
        where: and(eq(payables.userId, user.id), sql`${payables.status} != 'تم السداد'`),
      });

      for (const pay of userPayables) {
        if (pay.dueDate) {
          const dueDate = new Date(pay.dueDate);
          const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            const payMsg = `⚠️ <b>تنبيه موعد سداد التزام</b>\n\n` +
              `غدًا موعد سداد مبلغ <b>${formatCurrency(pay.remainingAmount, user.currency)}</b> لـ <b>${pay.personName}</b>.\n` +
              `• الوصف: ${pay.description || '-'}`;

            await sendTelegramMessage(user.telegramBotToken, user.telegramChatId, payMsg);
          } else if (diffDays < 0 && pay.status !== 'متأخر') {
            await db
              .update(payables)
              .set({ status: 'متأخر', updatedAt: new Date() })
              .where(eq(payables.id, pay.id));
          }
        }
      }

      // 3. ديون لك تجاوزت موعدها (تحديث الحالة)
      const userReceivables = await db.query.receivables.findMany({
        where: and(eq(receivables.userId, user.id), sql`${receivables.status} != 'تم التحصيل'`),
      });

      for (const rec of userReceivables) {
        if (rec.dueDate) {
          const dueDate = new Date(rec.dueDate);
          if (dueDate.getTime() < now.getTime() && rec.status !== 'متأخر') {
            await db
              .update(receivables)
              .set({ status: 'متأخر', updatedAt: new Date() })
              .where(eq(receivables.id, rec.id));
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Alerts processed' });
  } catch (error) {
    console.error('Alerts cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

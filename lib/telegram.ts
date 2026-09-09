import { Bot } from 'grammy';
import { db } from '@/db';
import {
  users,
  accounts,
  categories,
  transactions,
  receivables,
  payables,
  installments,
} from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { formatCurrency, formatDate } from './utils';

// Helper to create a Bot instance on the fly with custom token
export function createTelegramBot(token: string) {
  return new Bot(token);
}

// Function to register the webhook with Telegram API
export async function registerWebhook(botToken: string, appUrl: string, secretToken: string) {
  const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/telegram/webhook`;
  const url = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(
    webhookUrl
  )}&secret_token=${encodeURIComponent(secretToken)}`;

  const res = await fetch(url);
  const data = await res.json();
  return data;
}

// Function to send a text message directly
export async function sendTelegramMessage(botToken: string, chatId: string | number, text: string) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });
  return await res.json();
}

// Parse text message and handle bot commands
export async function handleTelegramMessage(user: typeof users.$inferSelect, text: string) {
  const token = user.telegramBotToken;
  const chatId = user.telegramChatId;
  if (!token || !chatId) {
    return 'لم يتم ضبط بيانات التليجرام بالكامل في الإعدادات.';
  }

  const trimmed = text.trim();

  // 1. أمر /start
  if (trimmed === '/start' || trimmed === 'start') {
    return `مرحبًا بك في نظامك المالي الشخصي 💰!

الأوامر المتاحة:
• /الرصيد - عرض الأرصدة الحالية في حساباتك
• /اليوم - تقرير دخل ومصروفات اليوم
• /الشهر - تقرير الشهر الحالي
• /لي - الديون المستحقة لك
• /علي - الالتزامات المستحقة عليك
• /الأقساط - حالة الأقساط القادمة

تسجيل سريع:
• <code>/صرف 250 طعام غداء</code> (تسجيل مصروف)
• <code>/دخل 5000 عمل حر دفعة مشروع</code> (تسجيل دخل)
• <code>/لي 3000 أحمد سلفة</code> (تسجيل دين لك)
• <code>/علي 5000 محمد التزام</code> (تسجيل دين عليك)`;
  }

  // 2. أمر /الرصيد
  if (trimmed === '/الرصيد') {
    const userAccounts = await db.query.accounts.findMany({
      where: eq(accounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return 'لا توجد حسابات مسجلة بعد. يمكنك إضافة حسابات من لوحة التحكم.';
    }

    let total = 0;
    let message = '🏦 <b>أرصدة حساباتك الحالية:</b>\n\n';
    for (const acc of userAccounts) {
      const bal = parseFloat(acc.balance);
      total += bal;
      message += `• ${acc.name}: <b>${formatCurrency(bal, user.currency)}</b>\n`;
    }
    message += `\n💵 <b>إجمالي الرصيد الفعلي: ${formatCurrency(total, user.currency)}</b>`;
    return message;
  }

  // 3. أمر /اليوم
  if (trimmed === '/اليوم') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userTrans = await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, user.id),
        sql`${transactions.transactionDate} >= ${today.toISOString()}`
      ),
      with: {
        category: true,
        account: true,
      },
      orderBy: [desc(transactions.transactionDate)],
    });

    let inc = 0;
    let exp = 0;
    for (const t of userTrans) {
      const amt = parseFloat(t.amount);
      if (t.type === 'income') inc += amt;
      if (t.type === 'expense') exp += amt;
    }

    const net = inc - exp;
    let msg = `📊 <b>تقرير اليوم (${formatDate(new Date())})</b>\n\n`;
    msg += `• الدخل: <b>+${formatCurrency(inc, user.currency)}</b>\n`;
    msg += `• المصروفات: <b>-${formatCurrency(exp, user.currency)}</b>\n`;
    msg += `• الصافي: <b>${net >= 0 ? '+' : ''}${formatCurrency(net, user.currency)}</b>\n\n`;

    if (userTrans.length > 0) {
      msg += `<b>آخر العمليات اليوم:</b>\n`;
      for (const t of userTrans.slice(0, 5)) {
        const sign = t.type === 'income' ? '🟢 +' : t.type === 'expense' ? '🔴 -' : '🔵';
        const cat = t.category?.name ? `(${t.category.name})` : '';
        msg += `${sign} ${formatCurrency(t.amount, user.currency)} ${cat} - ${t.description || 'بدون وصف'}\n`;
      }
    } else {
      msg += 'لم تسجل أي عمليات اليوم حتى الآن.';
    }

    return msg;
  }

  // 4. أمر /الشهر
  if (trimmed === '/الشهر') {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthTrans = await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, user.id),
        sql`${transactions.transactionDate} >= ${startOfMonth.toISOString()}`
      ),
    });

    let inc = 0;
    let exp = 0;
    for (const t of monthTrans) {
      const amt = parseFloat(t.amount);
      if (t.type === 'income') inc += amt;
      if (t.type === 'expense') exp += amt;
    }

    const savings = inc - exp;
    const rate = inc > 0 ? Math.round((savings / inc) * 100) : 0;

    return `📅 <b>تقرير الشهر الحالي:</b>\n\n` +
      `• إجمالي الدخل: <b>+${formatCurrency(inc, user.currency)}</b>\n` +
      `• إجمالي المصروفات: <b>-${formatCurrency(exp, user.currency)}</b>\n` +
      `• المدخرات: <b>${savings >= 0 ? '+' : ''}${formatCurrency(savings, user.currency)}</b>\n` +
      `• نسبة الادخار: <b>${rate}%</b>`;
  }

  // 5. أمر /لي
  if (trimmed === '/لي') {
    const recs = await db.query.receivables.findMany({
      where: and(eq(receivables.userId, user.id), sql`${receivables.status} != 'تم التحصيل'`),
    });

    if (recs.length === 0) {
      return '🎉 ليس لديك أي ديون مستحقة عند الآخرين!';
    }

    let total = 0;
    let msg = '📥 <b>أموال مستحقة لك عند الآخرين:</b>\n\n';
    for (const r of recs) {
      const rem = parseFloat(r.remainingAmount);
      total += rem;
      msg += `• <b>${r.personName}</b>: ${formatCurrency(rem, user.currency)} (${r.status})\n`;
    }
    msg += `\n<b>الإجمالي المستحق لك: ${formatCurrency(total, user.currency)}</b>`;
    return msg;
  }

  // 6. أمر /علي
  if (trimmed === '/علي') {
    const pays = await db.query.payables.findMany({
      where: and(eq(payables.userId, user.id), sql`${payables.status} != 'تم السداد'`),
    });

    if (pays.length === 0) {
      return '🎉 ليس عليك أي التزامات أو ديون حاليًا!';
    }

    let total = 0;
    let msg = '📤 <b>التزامات وديون مستحقة عليك:</b>\n\n';
    for (const p of pays) {
      const rem = parseFloat(p.remainingAmount);
      total += rem;
      msg += `• <b>${p.personName}</b>: ${formatCurrency(rem, user.currency)} (${p.status})\n`;
    }
    msg += `\n<b>إجمالي الالتزامات: ${formatCurrency(total, user.currency)}</b>`;
    return msg;
  }

  // 7. أمر /الأقساط
  if (trimmed === '/الأقساط') {
    const insts = await db.query.installments.findMany({
      where: and(eq(installments.userId, user.id), eq(installments.status, 'نشط')),
    });

    if (insts.length === 0) {
      return '🎉 لا توجد أي أقساط نشطة حالياً!';
    }

    let msg = '📋 <b>الأقساط النشطة:</b>\n\n';
    for (const inst of insts) {
      msg += `• <b>${inst.name}</b>: ${formatCurrency(inst.installmentAmount, user.currency)}/شهريًا\n` +
        `  المدفوع: ${inst.paidCount} من ${inst.installmentCount} أقساط\n` +
        `  المتبقي: ${formatCurrency(inst.remainingAmount, user.currency)}\n` +
        `  القسط القادم: ${formatDate(inst.nextDate)}\n\n`;
    }
    return msg;
  }

  // 8. أمر تسجيل مصروف: /صرف [مبلغ] [تصنيف] [وصف...]
  if (trimmed.startsWith('/صرف ') || trimmed.startsWith('صرف ')) {
    const parts = trimmed.split(/\s+/).slice(1);
    if (parts.length === 0) return 'يرجى كتابة المبلغ والتصنيف، مثل: <code>/صرف 250 طعام غداء</code>';

    const amount = parseFloat(parts[0]);
    if (isNaN(amount) || amount <= 0) return '❌ المبلغ غير صحيح';

    const rest = parts.slice(1);
    let categoryName = rest[0] || 'أخرى';
    let description = rest.slice(1).join(' ') || categoryName;

    // ابحث عن التصنيف أو أنشئ أو استخدم الافتراضي
    const userCategories = await db.query.categories.findMany({
      where: and(eq(categories.userId, user.id), eq(categories.type, 'expense')),
    });

    let matchedCategory = userCategories.find((c) =>
      c.name.includes(categoryName) || categoryName.includes(c.name)
    );

    if (!matchedCategory) {
      matchedCategory = userCategories.find((c) => c.name === 'أخرى') || userCategories[0];
      description = rest.join(' ');
    }

    // ابحث عن حساب الكاش أو أول حساب
    const userAccounts = await db.query.accounts.findMany({
      where: eq(accounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return '❌ لا يوجد حساب مسجل لخصم المصروف منه. يرجى إنشاء حساب أولاً.';
    }

    const defaultAccount =
      userAccounts.find((a) => a.type === 'cash' || a.name.includes('كاش')) || userAccounts[0];

    // تسجيل العملية وتحديث رصيد الحساب
    const newBalance = parseFloat(defaultAccount.balance) - amount;

    await db.insert(transactions).values({
      userId: user.id,
      accountId: defaultAccount.id,
      categoryId: matchedCategory ? matchedCategory.id : null,
      type: 'expense',
      amount: amount.toFixed(2),
      description: description || 'مصروف سريع من تليجرام',
      transactionDate: new Date(),
    });

    await db
      .update(accounts)
      .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
      .where(eq(accounts.id, defaultAccount.id));

    // حساب إجمالي مصروف اليوم
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTransactions = await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, user.id),
        eq(transactions.type, 'expense'),
        sql`${transactions.transactionDate} >= ${today.toISOString()}`
      ),
    });

    const totalTodayExp = todayTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return `✅ <b>تم تسجيل المصروف بنجاح!</b>\n\n` +
      `💸 <b>المبلغ:</b> ${formatCurrency(amount, user.currency)}\n` +
      `🏷️ <b>التصنيف:</b> ${matchedCategory ? matchedCategory.name : 'أخرى'}\n` +
      `📝 <b>الوصف:</b> ${description || '-'}\n` +
      `🏦 <b>الحساب:</b> ${defaultAccount.name} (الرصيد: ${formatCurrency(newBalance, user.currency)})\n` +
      `📅 <b>التاريخ:</b> ${formatDate(new Date())}\n\n` +
      `📊 <b>إجمالي مصروفات اليوم:</b> ${formatCurrency(totalTodayExp, user.currency)}`;
  }

  // 9. أمر تسجيل دخل: /دخل [مبلغ] [تصنيف/مصدر] [وصف...]
  if (trimmed.startsWith('/دخل ') || trimmed.startsWith('دخل ')) {
    const parts = trimmed.split(/\s+/).slice(1);
    if (parts.length === 0) return 'يرجى كتابة المبلغ والمصدر، مثل: <code>/دخل 5000 عمل حر مشروع</code>';

    const amount = parseFloat(parts[0]);
    if (isNaN(amount) || amount <= 0) return '❌ المبلغ غير صحيح';

    const rest = parts.slice(1);
    let categoryName = rest[0] || 'الراتب';
    let description = rest.slice(1).join(' ') || categoryName;

    const userCategories = await db.query.categories.findMany({
      where: and(eq(categories.userId, user.id), eq(categories.type, 'income')),
    });

    let matchedCategory = userCategories.find((c) =>
      c.name.includes(categoryName) || categoryName.includes(c.name)
    );

    if (!matchedCategory) {
      matchedCategory = userCategories[0];
      description = rest.join(' ');
    }

    const userAccounts = await db.query.accounts.findMany({
      where: eq(accounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return '❌ لا يوجد حساب مسجل لإيداع الدخل فيه.';
    }

    const defaultAccount =
      userAccounts.find((a) => a.type === 'bank' || a.name.includes('بنك')) || userAccounts[0];

    const newBalance = parseFloat(defaultAccount.balance) + amount;

    await db.insert(transactions).values({
      userId: user.id,
      accountId: defaultAccount.id,
      categoryId: matchedCategory ? matchedCategory.id : null,
      type: 'income',
      amount: amount.toFixed(2),
      description: description || 'دخل سريع من تليجرام',
      transactionDate: new Date(),
    });

    await db
      .update(accounts)
      .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
      .where(eq(accounts.id, defaultAccount.id));

    return `✅ <b>تم تسجيل الدخل بنجاح!</b>\n\n` +
      `💰 <b>المبلغ:</b> +${formatCurrency(amount, user.currency)}\n` +
      `🏷️ <b>التصنيف:</b> ${matchedCategory ? matchedCategory.name : 'دخل'}\n` +
      `📝 <b>الوصف:</b> ${description || '-'}\n` +
      `🏦 <b>الحساب:</b> ${defaultAccount.name} (الرصيد: ${formatCurrency(newBalance, user.currency)})\n` +
      `📅 <b>التاريخ:</b> ${formatDate(new Date())}`;
  }

  // 10. أمر تسجيل دين لك: /لي [مبلغ] [اسم الشخص]
  if (trimmed.startsWith('/لي ') || trimmed.startsWith('لي ')) {
    const parts = trimmed.split(/\s+/).slice(1);
    if (parts.length < 2) return 'يرجى كتابة المبلغ والاسم، مثل: <code>/لي 3000 أحمد سلفة</code>';

    const amount = parseFloat(parts[0]);
    if (isNaN(amount) || amount <= 0) return '❌ المبلغ غير صحيح';

    const personName = parts[1];
    const description = parts.slice(2).join(' ') || 'سلفة / مستحق';

    await db.insert(receivables).values({
      userId: user.id,
      personName,
      originalAmount: amount.toFixed(2),
      paidAmount: '0.00',
      remainingAmount: amount.toFixed(2),
      description,
      status: 'مستحق',
    });

    return `✅ <b>تم تسجيل المبلغ المستحق لك!</b>\n\n` +
      `👤 <b>الشخص:</b> ${personName}\n` +
      `💵 <b>المبلغ:</b> ${formatCurrency(amount, user.currency)}\n` +
      `📝 <b>الوصف:</b> ${description}\n\n` +
      `⚠️ <i>تنبيه: المبلغ لا يزيد رصيدك الفعلي حتى يتم تحصيله.</i>`;
  }

  // 11. أمر تسجيل دين عليك: /علي [مبلغ] [اسم الشخص]
  if (trimmed.startsWith('/علي ') || trimmed.startsWith('علي ')) {
    const parts = trimmed.split(/\s+/).slice(1);
    if (parts.length < 2) return 'يرجى كتابة المبلغ والاسم، مثل: <code>/علي 5000 محمد التزام</code>';

    const amount = parseFloat(parts[0]);
    if (isNaN(amount) || amount <= 0) return '❌ المبلغ غير صحيح';

    const personName = parts[1];
    const description = parts.slice(2).join(' ') || 'دين / التزام';

    await db.insert(payables).values({
      userId: user.id,
      personName,
      originalAmount: amount.toFixed(2),
      paidAmount: '0.00',
      remainingAmount: amount.toFixed(2),
      description,
      status: 'مستحق',
    });

    return `✅ <b>تم تسجيل الالتزام عليك بنجاح!</b>\n\n` +
      `👤 <b>الجهة/الشخص:</b> ${personName}\n` +
      `💸 <b>المبلغ:</b> ${formatCurrency(amount, user.currency)}\n` +
      `📝 <b>الوصف:</b> ${description}\n\n` +
      `⚠️ <i>تنبيه: لا يتم خصمه من حسابك البنكي إلا عند سداده فعليًا.</i>`;
  }

  return 'عذرًا، لم أفهم هذا الأمر. أرسل /start لمعرفة الأوامر المتاحة.';
}

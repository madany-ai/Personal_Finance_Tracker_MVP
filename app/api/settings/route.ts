import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getCurrentUser } from '@/lib/session';
import { eq } from 'drizzle-orm';
import { sendTelegramMessage, registerWebhook } from '@/lib/telegram';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      currency: user.currency,
      targetSavingsRate: user.targetSavingsRate ?? 20,
      monthlySavingsGoal: user.monthlySavingsGoal ? parseFloat(user.monthlySavingsGoal) : 0,
      telegramBotToken: user.telegramBotToken ? '••••••••' + user.telegramBotToken.slice(-6) : '',
      hasTelegramToken: !!user.telegramBotToken,
      telegramChatId: user.telegramChatId || '',
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'خطأ أثناء جلب الإعدادات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // 1. Action: Test Telegram Connection
    if (action === 'test_telegram') {
      const token = body.botToken || user.telegramBotToken;
      const chatId = body.chatId || user.telegramChatId;

      if (!token || !chatId) {
        return NextResponse.json(
          { error: 'يرجى إدخال Bot Token و Chat ID أولاً لإجراء الاختبار' },
          { status: 400 }
        );
      }

      const testMsg = `🔔 <b>تجربة الاتصال بنجاح!</b>\nتم توصيل نظام إدارة الأموال الشخصية بالبوت بنجاح.\n📅 ${new Date().toLocaleString('ar-EG')}`;
      const res = await sendTelegramMessage(token, chatId, testMsg);

      if (!res.ok) {
        return NextResponse.json(
          { error: `فشل الاتصال بتليجرام: ${res.description || 'تأكد من صحة الـ Token و Chat ID'}` },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, message: 'تم إرسال رسالة تجريبية بنجاح إلى حسابك في تليجرام!' });
    }

    // 2. Action: Register Webhook
    if (action === 'register_webhook') {
      const token = body.botToken || user.telegramBotToken;
      if (!token) {
        return NextResponse.json({ error: 'يرجى إدخال Bot Token أولاً' }, { status: 400 });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
      const secret = process.env.TELEGRAM_WEBHOOK_SECRET || 'secret';

      const res = await registerWebhook(token, appUrl, secret);
      if (!res.ok) {
        return NextResponse.json(
          { error: `فشل تسجيل Webhook: ${res.description}` },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, message: 'تم تسجيل Webhook بنجاح مع تليجرام!' });
    }

    // 3. Action: Update Telegram Credentials
    if (action === 'update_telegram') {
      const { botToken, chatId } = body;
      const updateData: { telegramBotToken?: string; telegramChatId?: string; updatedAt: Date } = {
        updatedAt: new Date(),
      };

      if (botToken && !botToken.startsWith('••••')) {
        updateData.telegramBotToken = botToken.trim();
      }
      if (chatId !== undefined) {
        updateData.telegramChatId = chatId.trim();
      }

      await db.update(users).set(updateData).where(eq(users.id, user.id));

      return NextResponse.json({ success: true, message: 'تم حفظ إعدادات تليجرام بنجاح' });
    }

    // 3. Action: Update Savings Goals
    if (action === 'update_savings_goals') {
      const { targetSavingsRate, monthlySavingsGoal } = body;
      const rate = parseInt(targetSavingsRate);
      const goal = parseFloat(monthlySavingsGoal);

      await db
        .update(users)
        .set({
          targetSavingsRate: isNaN(rate) ? 20 : Math.min(Math.max(rate, 0), 100),
          monthlySavingsGoal: isNaN(goal) ? '0.00' : goal.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return NextResponse.json({ success: true, message: 'تم حفظ أهداف ونسبة الادخار بنجاح!' });
    }

    // 4. Action: Update Telegram Credentials
    if (action === 'update_profile') {
      const { name, currency, currentPassword, newPassword } = body;
      const updateData: any = { updatedAt: new Date() };

      if (name) updateData.name = name.trim();
      if (currency) updateData.currency = currency.trim();

      if (newPassword) {
        if (!currentPassword) {
          return NextResponse.json({ error: 'يرجى إدخال كلمة المرور الحالية لتغييرها' }, { status: 400 });
        }
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
          return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
        }
        if (newPassword.length < 6) {
          return NextResponse.json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
        }
        const salt = await bcrypt.genSalt(10);
        updateData.passwordHash = await bcrypt.hash(newPassword, salt);
      }

      await db.update(users).set(updateData).where(eq(users.id, user.id));
      return NextResponse.json({ success: true, message: 'تم تحديث البيانات بنجاح' });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json({ error: 'خطأ أثناء معالجة الطلب' }, { status: 500 });
  }
}

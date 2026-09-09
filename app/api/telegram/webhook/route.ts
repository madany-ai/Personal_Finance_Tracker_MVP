import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { handleTelegramMessage, sendTelegramMessage } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Check if it's a message
    if (!update || !update.message || !update.message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = update.message.chat?.id?.toString();
    const text = update.message.text;

    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    // Find the user registered with this chatId, or the primary user
    let user = await db.query.users.findFirst({
      where: eq(users.telegramChatId, chatId),
    });

    // If no user found by chatId yet, let's check if there is an admin user waiting to link
    if (!user) {
      const allUsers = await db.query.users.findMany({ limit: 1 });
      const firstUser = allUsers[0];

      // If text is /start or a pairing command, we can help the user link
      if (firstUser && (!firstUser.telegramChatId || firstUser.telegramChatId === '')) {
        // Automatically link this chat ID to the user if they have the bot token configured
        if (firstUser.telegramBotToken) {
          await db
            .update(users)
            .set({ telegramChatId: chatId, updatedAt: new Date() })
            .where(eq(users.id, firstUser.id));

          await sendTelegramMessage(
            firstUser.telegramBotToken,
            chatId,
            `🎉 <b>تم ربط حسابك بنجاح!</b>\nمعرف المحادثة الخاص بك هو: <code>${chatId}</code>\n\nأرسل /start لبدء الاستخدام.`
          );
          return NextResponse.json({ ok: true });
        }
      }

      if (firstUser && firstUser.telegramBotToken) {
        await sendTelegramMessage(
          firstUser.telegramBotToken,
          chatId,
          `⚠️ هذا الحساب غير مصرح له باستخدام البوت.\nمعرف محادثتك هو: <code>${chatId}</code>\nيرجى وضعه في صفحة الإعدادات بالتطبيق.`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Process the message
    const replyText = await handleTelegramMessage(user, text);

    if (user.telegramBotToken) {
      await sendTelegramMessage(user.telegramBotToken, chatId, replyText);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram so it doesn't spam retries
  }
}

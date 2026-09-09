import 'dotenv/config';
import { db } from '../db';
import { settings, users } from '../db/schema';
import { eq } from 'drizzle-orm';

async function updateTelegram() {
  try {
    const allUsers = await db.query.users.findMany();
    if (allUsers.length === 0) {
      console.log('No users found');
      return;
    }
    
    const userId = allUsers[0].id; // Assuming admin is the first user
    
    // Check if settings exist for user
    const userSettings = await db.query.settings.findFirst({
      where: eq(settings.userId, userId),
    });

    const botToken = '8962385045:AAFwh2LCvw10SHKaZtmsBHPKi5Hvwem1_YM';

    if (userSettings) {
      await db.update(settings)
        .set({ telegramBotToken: botToken })
        .where(eq(settings.userId, userId));
      console.log('Settings updated successfully!');
    } else {
      await db.insert(settings).values({
        userId,
        telegramBotToken: botToken,
      });
      console.log('Settings created successfully!');
    }
  } catch (err) {
    console.error('Error updating settings:', err);
  } finally {
    process.exit(0);
  }
}

updateTelegram();

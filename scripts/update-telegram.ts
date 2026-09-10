import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

async function updateTelegram() {
  try {
    const allUsers = await db.query.users.findMany();
    if (allUsers.length === 0) {
      console.log('No users found');
      return;
    }
    
    const userId = allUsers[0].id;
    const botToken = '8962385045:AAFwh2LCvw10SHKaZtmsBHPKi5Hvwem1_YM';

    await db.update(users)
      .set({ telegramBotToken: botToken })
      .where(eq(users.id, userId));

    console.log(`Updated user ${allUsers[0].email} (${userId}) with telegramBotToken!`);
  } catch (err) {
    console.error('Error updating settings:', err);
  } finally {
    process.exit(0);
  }
}

updateTelegram();


import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import bcrypt from 'bcryptjs';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../lib/constants';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is not set in environment variables.');
    process.exit(1);
  }

  console.log('🔄 جاري الاتصال بقاعدة البيانات وإعداد البيانات الأولية...');
  const sql = neon(connectionString);
  const db = drizzle(sql, { schema });

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@finance.local').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

  // 1. التحقق من وجود المستخدم أو إنشاؤه
  let user = await db.query.users.findFirst({
    where: eq(schema.users.email, adminEmail),
  });

  if (!user) {
    console.log(`👤 إنشاء المستخدم الافتراضي: ${adminEmail}`);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const [createdUser] = await db
      .insert(schema.users)
      .values({
        email: adminEmail,
        passwordHash,
        name: 'صاحب الحساب',
        currency: 'ج.م',
      })
      .returning();

    user = createdUser;
    console.log(`✅ تم إنشاء المستخدم بنجاح (المعرف: ${user.id})`);
  } else {
    console.log(`ℹ️ المستخدم موجود بالفعل: ${adminEmail}`);
  }

  // 2. إدخال تصنيفات المصروفات الافتراضية
  console.log('📦 التحقق من تصنيفات المصروفات...');
  for (const catName of DEFAULT_EXPENSE_CATEGORIES) {
    const existing = await db.query.categories.findFirst({
      where: (cat, { and, eq }) =>
        and(
          eq(cat.userId, user!.id),
          eq(cat.name, catName),
          eq(cat.type, 'expense')
        ),
    });

    if (!existing) {
      await db.insert(schema.categories).values({
        userId: user!.id,
        name: catName,
        type: 'expense',
        isDefault: true,
      });
    }
  }

  // 3. إدخال تصنيفات الدخل الافتراضية
  console.log('💰 التحقق من تصنيفات الدخل...');
  for (const catName of DEFAULT_INCOME_CATEGORIES) {
    const existing = await db.query.categories.findFirst({
      where: (cat, { and, eq }) =>
        and(
          eq(cat.userId, user!.id),
          eq(cat.name, catName),
          eq(cat.type, 'income')
        ),
    });

    if (!existing) {
      await db.insert(schema.categories).values({
        userId: user!.id,
        name: catName,
        type: 'income',
        isDefault: true,
      });
    }
  }

  // 4. إنشاء حسابات أساسية إذا لم تكن موجودة (بنك وكاش)
  const existingAccounts = await db.query.accounts.findMany({
    where: eq(schema.accounts.userId, user!.id),
  });

  if (existingAccounts.length === 0) {
    console.log('🏦 إنشاء الحسابات الافتراضية (البنك + كاش)...');
    await db.insert(schema.accounts).values([
      {
        userId: user!.id,
        name: 'الحساب البنكي',
        type: 'bank',
        balance: '0.00',
      },
      {
        userId: user!.id,
        name: 'الكاش (نقدي)',
        type: 'cash',
        balance: '0.00',
      },
      {
        userId: user!.id,
        name: 'محفظة إلكترونية',
        type: 'wallet',
        balance: '0.00',
      },
    ]);
    console.log('✅ تم إنشاء الحسابات الافتراضية');
  }

  console.log('🎉 اكتمل إعداد البيانات الأولية بنجاح!');
}

seed().catch((err) => {
  console.error('❌ خطأ أثناء إعداد البيانات:', err);
  process.exit(1);
});

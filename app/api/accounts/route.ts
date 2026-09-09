import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { accounts } from '@/db/schema';
import { getCurrentUser } from '@/lib/session';
import { accountSchema } from '@/lib/validators';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const userAccounts = await db.query.accounts.findMany({
      where: eq(accounts.userId, user.id),
      orderBy: [desc(accounts.createdAt)],
    });

    return NextResponse.json(userAccounts);
  } catch (error) {
    console.error('Accounts GET error:', error);
    return NextResponse.json({ error: 'خطأ أثناء جلب الحسابات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await req.json();
    const parsed = accountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' }, { status: 400 });
    }

    const { name, type, balance } = parsed.data;
    const [newAccount] = await db
      .insert(accounts)
      .values({
        userId: user.id,
        name,
        type,
        balance: balance.toFixed(2),
      })
      .returning();

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error('Accounts POST error:', error);
    return NextResponse.json({ error: 'خطأ أثناء إنشاء الحساب' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recurringExpenses } from '@/db/schema';
import { getCurrentUser } from '@/lib/session';
import { recurringExpenseSchema } from '@/lib/validators';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const list = await db.query.recurringExpenses.findMany({
      where: eq(recurringExpenses.userId, user.id),
      orderBy: [desc(recurringExpenses.nextDueDate)],
      with: {
        category: true,
        account: true,
      },
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error('Recurring Expenses GET error:', error);
    return NextResponse.json({ error: 'خطأ أثناء جلب المصاريف المتكررة' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await req.json();
    const parsed = recurringExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' }, { status: 400 });
    }

    const { name, amount, categoryId, accountId, frequency, nextDueDate, status } = parsed.data;

    const [newRec] = await db
      .insert(recurringExpenses)
      .values({
        userId: user.id,
        name: name.trim(),
        amount: amount.toFixed(2),
        categoryId: categoryId || null,
        accountId: accountId || null,
        frequency,
        nextDueDate: new Date(nextDueDate),
        status: status || 'نشط',
      })
      .returning();

    return NextResponse.json(newRec, { status: 201 });
  } catch (error) {
    console.error('Recurring Expenses POST error:', error);
    return NextResponse.json({ error: 'خطأ أثناء إضافة المصروف المتكرر' }, { status: 500 });
  }
}

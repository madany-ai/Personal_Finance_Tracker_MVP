import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { expectedIncome, transactions, accounts } from '@/db/schema';
import { getCurrentUser } from '@/lib/session';
import { expectedIncomeSchema } from '@/lib/validators';
import { eq, and, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const list = await db.query.expectedIncome.findMany({
      where: eq(expectedIncome.userId, user.id),
      orderBy: [desc(expectedIncome.expectedDate)],
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error('Expected Income GET error:', error);
    return NextResponse.json({ error: 'خطأ أثناء جلب الدخل المتوقع' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await req.json();
    const parsed = expectedIncomeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' }, { status: 400 });
    }

    const { source, amount, expectedDate, description, status } = parsed.data;

    const [newExp] = await db
      .insert(expectedIncome)
      .values({
        userId: user.id,
        source: source.trim(),
        amount: amount.toFixed(2),
        expectedDate: new Date(expectedDate),
        description: description || null,
        status: status || 'متوقع',
      })
      .returning();

    return NextResponse.json(newExp, { status: 201 });
  } catch (error) {
    console.error('Expected Income POST error:', error);
    return NextResponse.json({ error: 'خطأ أثناء تسجيل الدخل المتوقع' }, { status: 500 });
  }
}

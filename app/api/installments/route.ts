import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { installments } from '@/db/schema';
import { getCurrentUser } from '@/lib/session';
import { installmentSchema } from '@/lib/validators';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const list = await db.query.installments.findMany({
      where: eq(installments.userId, user.id),
      orderBy: [desc(installments.createdAt)],
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error('Installments GET error:', error);
    return NextResponse.json({ error: 'خطأ أثناء جلب الأقساط' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await req.json();
    const parsed = installmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' }, { status: 400 });
    }

    const {
      name,
      entity,
      totalAmount,
      installmentCount,
      installmentAmount,
      paidCount,
      paidAmount,
      firstDate,
      nextDate,
      frequency,
    } = parsed.data;

    const remainingCount = Math.max(0, installmentCount - paidCount);
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    const status = remainingCount === 0 ? 'مكتمل' : 'نشط';

    const [newInst] = await db
      .insert(installments)
      .values({
        userId: user.id,
        name: name.trim(),
        entity: entity ? entity.trim() : null,
        totalAmount: totalAmount.toFixed(2),
        installmentCount,
        installmentAmount: installmentAmount.toFixed(2),
        paidCount,
        remainingCount,
        paidAmount: paidAmount.toFixed(2),
        remainingAmount: remainingAmount.toFixed(2),
        firstDate: new Date(firstDate),
        nextDate: new Date(nextDate),
        frequency,
        status,
      })
      .returning();

    return NextResponse.json(newInst, { status: 201 });
  } catch (error) {
    console.error('Installments POST error:', error);
    return NextResponse.json({ error: 'خطأ أثناء إضافة القسط' }, { status: 500 });
  }
}

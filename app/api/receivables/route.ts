import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { receivables } from '@/db/schema';
import { getCurrentUser } from '@/lib/session';
import { receivableSchema } from '@/lib/validators';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const list = await db.query.receivables.findMany({
      where: eq(receivables.userId, user.id),
      orderBy: [desc(receivables.createdAt)],
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error('Receivables GET error:', error);
    return NextResponse.json({ error: 'خطأ أثناء جلب الديون المستحقة' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await req.json();
    const parsed = receivableSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' }, { status: 400 });
    }

    const { personName, originalAmount, paidAmount, description, dueDate, status } = parsed.data;
    const remaining = originalAmount - paidAmount;

    let computedStatus = status;
    if (remaining <= 0) {
      computedStatus = 'تم التحصيل';
    } else if (paidAmount > 0) {
      computedStatus = 'مدفوع جزئيًا';
    }

    const [newRec] = await db
      .insert(receivables)
      .values({
        userId: user.id,
        personName: personName.trim(),
        originalAmount: originalAmount.toFixed(2),
        paidAmount: paidAmount.toFixed(2),
        remainingAmount: remaining.toFixed(2),
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: computedStatus,
      })
      .returning();

    return NextResponse.json(newRec, { status: 201 });
  } catch (error) {
    console.error('Receivables POST error:', error);
    return NextResponse.json({ error: 'خطأ أثناء تسجيل الدين المستحق' }, { status: 500 });
  }
}

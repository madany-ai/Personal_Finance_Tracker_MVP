import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payables, accounts, transactions } from '@/db/schema';
import { getCurrentUser } from '@/lib/session';
import { payableSchema } from '@/lib/validators';
import { eq, desc, and } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const list = await db.query.payables.findMany({
      where: eq(payables.userId, user.id),
      orderBy: [desc(payables.createdAt)],
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error('Payables GET error:', error);
    return NextResponse.json({ error: 'خطأ أثناء جلب الديون والالتزامات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await req.json();
    const parsed = payableSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' }, { status: 400 });
    }

    const { personName, originalAmount, paidAmount, description, dueDate, status, isLoan, depositAccountId } = parsed.data;
    const remaining = originalAmount - paidAmount;

    let computedStatus = status;
    if (remaining <= 0) {
      computedStatus = 'تم السداد';
    } else if (paidAmount > 0) {
      computedStatus = 'مدفوع جزئيًا';
    }

    const [newPay] = await db
      .insert(payables)
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

    if (isLoan && depositAccountId) {
      const [acc] = await db.select().from(accounts).where(and(eq(accounts.id, depositAccountId), eq(accounts.userId, user.id)));
      if (acc) {
        const newBalance = parseFloat(acc.balance) + originalAmount;
        await db.update(accounts).set({ balance: newBalance.toFixed(2) }).where(eq(accounts.id, acc.id));
        
        await db.insert(transactions).values({
          userId: user.id,
          accountId: acc.id,
          type: 'income',
          amount: originalAmount.toFixed(2),
          description: `سلفة نقدية من: ${personName}`,
          transactionDate: new Date(),
        });
      }
    }

    return NextResponse.json(newPay, { status: 201 });
  } catch (error) {
    console.error('Payables POST error:', error);
    return NextResponse.json({ error: 'خطأ أثناء تسجيل الالتزام' }, { status: 500 });
  }
}

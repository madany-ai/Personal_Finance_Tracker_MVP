import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { installments, transactions, accounts } from '@/db/schema';
import { getCurrentUser } from '@/lib/session';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const installmentId = parseInt(id);
    if (isNaN(installmentId)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

    const body = await req.json();
    const { action } = body;

    const existing = await db.query.installments.findFirst({
      where: and(eq(installments.id, installmentId), eq(installments.userId, user.id)),
    });

    if (!existing) return NextResponse.json({ error: 'القسط غير موجود' }, { status: 404 });

    // Action: Pay Installment
    if (action === 'pay_installment') {
      const sourceAccountId = body.accountId ? parseInt(body.accountId) : null;
      const instAmount = parseFloat(existing.installmentAmount);

      const newPaidCount = existing.paidCount + 1;
      const newRemainingCount = Math.max(0, existing.installmentCount - newPaidCount);
      const newPaidAmount = parseFloat(existing.paidAmount) + instAmount;
      const newRemainingAmount = Math.max(0, parseFloat(existing.totalAmount) - newPaidAmount);

      // Compute next date
      const curNextDate = new Date(existing.nextDate);
      const updatedNextDate = new Date(curNextDate);
      if (existing.frequency === 'أسبوعي') {
        updatedNextDate.setDate(curNextDate.getDate() + 7);
      } else if (existing.frequency === 'سنوي') {
        updatedNextDate.setFullYear(curNextDate.getFullYear() + 1);
      } else {
        // شهري (افتراضي)
        updatedNextDate.setMonth(curNextDate.getMonth() + 1);
      }

      const newStatus = newRemainingCount === 0 ? 'مكتمل' : 'نشط';

      // 1. Update installment
      const [updated] = await db
        .update(installments)
        .set({
          paidCount: newPaidCount,
          remainingCount: newRemainingCount,
          paidAmount: newPaidAmount.toFixed(2),
          remainingAmount: newRemainingAmount.toFixed(2),
          nextDate: updatedNextDate,
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(installments.id, installmentId))
        .returning();

      // 2. If accountId provided, record actual expense and deduct from account
      if (sourceAccountId) {
        const sourceAcc = await db.query.accounts.findFirst({
          where: and(eq(accounts.id, sourceAccountId), eq(accounts.userId, user.id)),
        });

        if (sourceAcc) {
          await db.insert(transactions).values({
            userId: user.id,
            accountId: sourceAccountId,
            type: 'expense',
            amount: instAmount.toFixed(2),
            description: `دفع قسط (${existing.name}) رقم ${newPaidCount}`,
            transactionDate: new Date(),
          });

          const currentBal = parseFloat(sourceAcc.balance);
          await db
            .update(accounts)
            .set({ balance: (currentBal - instAmount).toFixed(2), updatedAt: new Date() })
            .where(eq(accounts.id, sourceAccountId));
        }
      }

      return NextResponse.json(updated);
    }

    // Default Edit
    const total = parseFloat(body.totalAmount ?? existing.totalAmount);
    const count = parseInt(body.installmentCount ?? existing.installmentCount);
    const instAmt = parseFloat(body.installmentAmount ?? existing.installmentAmount);
    const pCount = parseInt(body.paidCount ?? existing.paidCount);
    const pAmt = parseFloat(body.paidAmount ?? existing.paidAmount);
    const rCount = Math.max(0, count - pCount);
    const rAmt = Math.max(0, total - pAmt);

    const [updated] = await db
      .update(installments)
      .set({
        name: body.name ?? existing.name,
        entity: body.entity ?? existing.entity,
        totalAmount: total.toFixed(2),
        installmentCount: count,
        installmentAmount: instAmt.toFixed(2),
        paidCount: pCount,
        remainingCount: rCount,
        paidAmount: pAmt.toFixed(2),
        remainingAmount: rAmt.toFixed(2),
        firstDate: body.firstDate ? new Date(body.firstDate) : existing.firstDate,
        nextDate: body.nextDate ? new Date(body.nextDate) : existing.nextDate,
        frequency: body.frequency ?? existing.frequency,
        status: body.status ?? (rCount === 0 ? 'مكتمل' : 'نشط'),
        updatedAt: new Date(),
      })
      .where(eq(installments.id, installmentId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Installment PUT error:', error);
    return NextResponse.json({ error: 'خطأ أثناء تعديل القسط' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const installmentId = parseInt(id);
    if (isNaN(installmentId)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

    await db
      .delete(installments)
      .where(and(eq(installments.id, installmentId), eq(installments.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Installment DELETE error:', error);
    return NextResponse.json({ error: 'خطأ أثناء حذف القسط' }, { status: 500 });
  }
}

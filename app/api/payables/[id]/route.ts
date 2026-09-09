import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payables, transactions, accounts } from '@/db/schema';
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
    const payableId = parseInt(id);
    if (isNaN(payableId)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

    const body = await req.json();
    const { action } = body;

    const existing = await db.query.payables.findFirst({
      where: and(eq(payables.id, payableId), eq(payables.userId, user.id)),
    });

    if (!existing) return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 });

    // Action: Pay Debt
    if (action === 'pay') {
      const payAmount = parseFloat(body.amount);
      const sourceAccountId = body.accountId ? parseInt(body.accountId) : null;

      if (isNaN(payAmount) || payAmount <= 0) {
        return NextResponse.json({ error: 'المبلغ المسدد غير صحيح' }, { status: 400 });
      }

      const currentPaid = parseFloat(existing.paidAmount);
      const original = parseFloat(existing.originalAmount);
      const newPaid = currentPaid + payAmount;
      const newRemaining = Math.max(0, original - newPaid);

      const newStatus = newRemaining <= 0 ? 'تم السداد' : 'مدفوع جزئيًا';

      // 1. Update payable
      const [updated] = await db
        .update(payables)
        .set({
          paidAmount: newPaid.toFixed(2),
          remainingAmount: newRemaining.toFixed(2),
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(payables.id, payableId))
        .returning();

      // 2. If sourceAccountId provided, record an actual expense transaction and deduct from account
      if (sourceAccountId) {
        const sourceAcc = await db.query.accounts.findFirst({
          where: and(eq(accounts.id, sourceAccountId), eq(accounts.userId, user.id)),
        });

        if (sourceAcc) {
          await db.insert(transactions).values({
            userId: user.id,
            accountId: sourceAccountId,
            type: 'expense',
            amount: payAmount.toFixed(2),
            description: `سداد دين لـ ${existing.personName}`,
            transactionDate: new Date(),
          });

          const currentBal = parseFloat(sourceAcc.balance);
          await db
            .update(accounts)
            .set({ balance: (currentBal - payAmount).toFixed(2), updatedAt: new Date() })
            .where(eq(accounts.id, sourceAccountId));
        }
      }

      return NextResponse.json(updated);
    }

    // Default Edit
    const original = parseFloat(body.originalAmount ?? existing.originalAmount);
    const paid = parseFloat(body.paidAmount ?? existing.paidAmount);
    const remaining = Math.max(0, original - paid);
    let status = body.status || (remaining <= 0 ? 'تم السداد' : paid > 0 ? 'مدفوع جزئيًا' : 'مستحق');

    const [updated] = await db
      .update(payables)
      .set({
        personName: body.personName ?? existing.personName,
        originalAmount: original.toFixed(2),
        paidAmount: paid.toFixed(2),
        remainingAmount: remaining.toFixed(2),
        description: body.description ?? existing.description,
        dueDate: body.dueDate ? new Date(body.dueDate) : existing.dueDate,
        status,
        updatedAt: new Date(),
      })
      .where(eq(payables.id, payableId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Payables PUT error:', error);
    return NextResponse.json({ error: 'خطأ أثناء التعديل' }, { status: 500 });
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
    const payableId = parseInt(id);
    if (isNaN(payableId)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

    await db
      .delete(payables)
      .where(and(eq(payables.id, payableId), eq(payables.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payable DELETE error:', error);
    return NextResponse.json({ error: 'خطأ أثناء الحذف' }, { status: 500 });
  }
}

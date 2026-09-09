import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { receivables, transactions, accounts } from '@/db/schema';
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
    const receivableId = parseInt(id);
    if (isNaN(receivableId)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

    const body = await req.json();
    const { action } = body;

    const existing = await db.query.receivables.findFirst({
      where: and(eq(receivables.id, receivableId), eq(receivables.userId, user.id)),
    });

    if (!existing) return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 });

    // Action: Collect Payment
    if (action === 'collect') {
      const collectAmount = parseFloat(body.amount);
      const targetAccountId = body.accountId ? parseInt(body.accountId) : null;

      if (isNaN(collectAmount) || collectAmount <= 0) {
        return NextResponse.json({ error: 'المبلغ المحصل غير صحيح' }, { status: 400 });
      }

      const currentPaid = parseFloat(existing.paidAmount);
      const original = parseFloat(existing.originalAmount);
      const newPaid = currentPaid + collectAmount;
      const newRemaining = Math.max(0, original - newPaid);

      const newStatus = newRemaining <= 0 ? 'تم التحصيل' : 'مدفوع جزئيًا';

      // 1. Update receivable
      const [updated] = await db
        .update(receivables)
        .set({
          paidAmount: newPaid.toFixed(2),
          remainingAmount: newRemaining.toFixed(2),
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(receivables.id, receivableId))
        .returning();

      // 2. If targetAccountId provided, record an actual income transaction and update account balance
      if (targetAccountId) {
        const targetAcc = await db.query.accounts.findFirst({
          where: and(eq(accounts.id, targetAccountId), eq(accounts.userId, user.id)),
        });

        if (targetAcc) {
          await db.insert(transactions).values({
            userId: user.id,
            accountId: targetAccountId,
            type: 'income',
            amount: collectAmount.toFixed(2),
            description: `تحصيل من ${existing.personName}`,
            transactionDate: new Date(),
          });

          const currentBal = parseFloat(targetAcc.balance);
          await db
            .update(accounts)
            .set({ balance: (currentBal + collectAmount).toFixed(2), updatedAt: new Date() })
            .where(eq(accounts.id, targetAccountId));
        }
      }

      return NextResponse.json(updated);
    }

    // Default Edit
    const original = parseFloat(body.originalAmount ?? existing.originalAmount);
    const paid = parseFloat(body.paidAmount ?? existing.paidAmount);
    const remaining = Math.max(0, original - paid);
    let status = body.status || (remaining <= 0 ? 'تم التحصيل' : paid > 0 ? 'مدفوع جزئيًا' : 'مستحق');

    const [updated] = await db
      .update(receivables)
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
      .where(eq(receivables.id, receivableId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Receivables PUT error:', error);
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
    const receivableId = parseInt(id);
    if (isNaN(receivableId)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

    await db
      .delete(receivables)
      .where(and(eq(receivables.id, receivableId), eq(receivables.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Receivable DELETE error:', error);
    return NextResponse.json({ error: 'خطأ أثناء الحذف' }, { status: 500 });
  }
}

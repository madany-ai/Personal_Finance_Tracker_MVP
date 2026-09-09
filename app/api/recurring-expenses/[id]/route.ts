import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recurringExpenses, transactions, accounts } from '@/db/schema';
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
    const recId = parseInt(id);
    if (isNaN(recId)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

    const body = await req.json();
    const { action } = body;

    const existing = await db.query.recurringExpenses.findFirst({
      where: and(eq(recurringExpenses.id, recId), eq(recurringExpenses.userId, user.id)),
    });

    if (!existing) return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 });

    // Action: Pay Now
    if (action === 'pay_now') {
      const sourceAccountId = body.accountId ? parseInt(body.accountId) : existing.accountId;
      const amt = parseFloat(existing.amount);

      // Compute next due date
      const curNextDate = new Date(existing.nextDueDate);
      const updatedNextDate = new Date(curNextDate);
      if (existing.frequency === 'أسبوعي') {
        updatedNextDate.setDate(curNextDate.getDate() + 7);
      } else if (existing.frequency === 'سنوي') {
        updatedNextDate.setFullYear(curNextDate.getFullYear() + 1);
      } else {
        // شهري (افتراضي)
        updatedNextDate.setMonth(curNextDate.getMonth() + 1);
      }

      // 1. Update next due date
      const [updated] = await db
        .update(recurringExpenses)
        .set({
          nextDueDate: updatedNextDate,
          updatedAt: new Date(),
        })
        .where(eq(recurringExpenses.id, recId))
        .returning();

      // 2. If accountId provided or exists, record actual expense and deduct from account
      if (sourceAccountId) {
        const sourceAcc = await db.query.accounts.findFirst({
          where: and(eq(accounts.id, sourceAccountId), eq(accounts.userId, user.id)),
        });

        if (sourceAcc) {
          await db.insert(transactions).values({
            userId: user.id,
            accountId: sourceAccountId,
            categoryId: existing.categoryId,
            type: 'expense',
            amount: amt.toFixed(2),
            description: `سداد مصروف متكرر: ${existing.name}`,
            transactionDate: new Date(),
          });

          const currentBal = parseFloat(sourceAcc.balance);
          await db
            .update(accounts)
            .set({ balance: (currentBal - amt).toFixed(2), updatedAt: new Date() })
            .where(eq(accounts.id, sourceAccountId));
        }
      }

      return NextResponse.json(updated);
    }

    // Default Edit
    const amt = parseFloat(body.amount ?? existing.amount);
    const [updated] = await db
      .update(recurringExpenses)
      .set({
        name: body.name ?? existing.name,
        amount: amt.toFixed(2),
        categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
        accountId: body.accountId !== undefined ? body.accountId : existing.accountId,
        frequency: body.frequency ?? existing.frequency,
        nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : existing.nextDueDate,
        status: body.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(recurringExpenses.id, recId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Recurring Expense PUT error:', error);
    return NextResponse.json({ error: 'خطأ أثناء تعديل المصروف المتكرر' }, { status: 500 });
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
    const recId = parseInt(id);
    if (isNaN(recId)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

    await db
      .delete(recurringExpenses)
      .where(and(eq(recurringExpenses.id, recId), eq(recurringExpenses.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Recurring Expense DELETE error:', error);
    return NextResponse.json({ error: 'خطأ أثناء حذف المصروف المتكرر' }, { status: 500 });
  }
}

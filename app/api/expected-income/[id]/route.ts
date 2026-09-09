import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { expectedIncome, transactions, accounts } from '@/db/schema';
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
    const incomeId = parseInt(id);
    if (isNaN(incomeId)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

    const body = await req.json();
    const { action } = body;

    const existing = await db.query.expectedIncome.findFirst({
      where: and(eq(expectedIncome.id, incomeId), eq(expectedIncome.userId, user.id)),
    });

    if (!existing) return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 });

    // Action: Receive Income
    if (action === 'receive') {
      const targetAccountId = body.accountId ? parseInt(body.accountId) : null;
      const amt = parseFloat(existing.amount);

      // 1. Update expected income status
      const [updated] = await db
        .update(expectedIncome)
        .set({
          status: 'وصل',
          updatedAt: new Date(),
        })
        .where(eq(expectedIncome.id, incomeId))
        .returning();

      // 2. If targetAccountId provided, record actual income transaction and update account balance
      if (targetAccountId) {
        const targetAcc = await db.query.accounts.findFirst({
          where: and(eq(accounts.id, targetAccountId), eq(accounts.userId, user.id)),
        });

        if (targetAcc) {
          await db.insert(transactions).values({
            userId: user.id,
            accountId: targetAccountId,
            type: 'income',
            amount: amt.toFixed(2),
            description: `استلام دخل متوقع: ${existing.source}`,
            transactionDate: new Date(),
          });

          const currentBal = parseFloat(targetAcc.balance);
          await db
            .update(accounts)
            .set({ balance: (currentBal + amt).toFixed(2), updatedAt: new Date() })
            .where(eq(accounts.id, targetAccountId));
        }
      }

      return NextResponse.json(updated);
    }

    // Default Edit
    const amt = parseFloat(body.amount ?? existing.amount);
    const [updated] = await db
      .update(expectedIncome)
      .set({
        source: body.source ?? existing.source,
        amount: amt.toFixed(2),
        expectedDate: body.expectedDate ? new Date(body.expectedDate) : existing.expectedDate,
        description: body.description ?? existing.description,
        status: body.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(expectedIncome.id, incomeId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Expected Income PUT error:', error);
    return NextResponse.json({ error: 'خطأ أثناء تعديل الدخل المتوقع' }, { status: 500 });
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
    const incomeId = parseInt(id);
    if (isNaN(incomeId)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

    await db
      .delete(expectedIncome)
      .where(and(eq(expectedIncome.id, incomeId), eq(expectedIncome.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Expected Income DELETE error:', error);
    return NextResponse.json({ error: 'خطأ أثناء حذف الدخل المتوقع' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, accounts } from '@/db/schema';
import { getCurrentUser } from '@/lib/session';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const transactionId = parseInt(id);
    if (isNaN(transactionId)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

    const tx = await db.query.transactions.findFirst({
      where: and(eq(transactions.id, transactionId), eq(transactions.userId, user.id)),
    });

    if (!tx) return NextResponse.json({ error: 'العملية غير موجودة' }, { status: 404 });

    const amount = parseFloat(tx.amount);

    // Revert balance changes
    const sourceAccount = await db.query.accounts.findFirst({
      where: eq(accounts.id, tx.accountId),
    });

    if (sourceAccount) {
      const srcBal = parseFloat(sourceAccount.balance);
      if (tx.type === 'expense') {
        await db
          .update(accounts)
          .set({ balance: (srcBal + amount).toFixed(2), updatedAt: new Date() })
          .where(eq(accounts.id, sourceAccount.id));
      } else if (tx.type === 'income') {
        await db
          .update(accounts)
          .set({ balance: (srcBal - amount).toFixed(2), updatedAt: new Date() })
          .where(eq(accounts.id, sourceAccount.id));
      } else if (tx.type === 'transfer' && tx.toAccountId) {
        const destAccount = await db.query.accounts.findFirst({
          where: eq(accounts.id, tx.toAccountId),
        });

        await db
          .update(accounts)
          .set({ balance: (srcBal + amount).toFixed(2), updatedAt: new Date() })
          .where(eq(accounts.id, sourceAccount.id));

        if (destAccount) {
          const destBal = parseFloat(destAccount.balance);
          await db
            .update(accounts)
            .set({ balance: (destBal - amount).toFixed(2), updatedAt: new Date() })
            .where(eq(accounts.id, destAccount.id));
        }
      }
    }

    // Delete transaction
    await db.delete(transactions).where(eq(transactions.id, transactionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transaction DELETE error:', error);
    return NextResponse.json({ error: 'خطأ أثناء حذف العملية' }, { status: 500 });
  }
}

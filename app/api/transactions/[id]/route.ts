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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const transactionId = parseInt(id);
    if (isNaN(transactionId)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

    const body = await req.json();
    const { type, amount, accountId, toAccountId, categoryId, description, transactionDate } = body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'مبلغ غير صالح' }, { status: 400 });
    }

    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) {
      return NextResponse.json({ error: 'حساب التحويل غير صالح' }, { status: 400 });
    }

    // 1. Fetch old transaction
    const oldTx = await db.query.transactions.findFirst({
      where: and(eq(transactions.id, transactionId), eq(transactions.userId, user.id)),
    });

    if (!oldTx) return NextResponse.json({ error: 'العملية غير موجودة' }, { status: 404 });

    const oldAmount = parseFloat(oldTx.amount);

    // 2. Revert old transaction's effect on balances
    const oldSourceAccount = await db.query.accounts.findFirst({
      where: eq(accounts.id, oldTx.accountId),
    });

    if (oldSourceAccount) {
      let srcBal = parseFloat(oldSourceAccount.balance);
      if (oldTx.type === 'expense') {
        srcBal += oldAmount;
      } else if (oldTx.type === 'income') {
        srcBal -= oldAmount;
      } else if (oldTx.type === 'transfer' && oldTx.toAccountId) {
        srcBal += oldAmount;
        const oldDestAccount = await db.query.accounts.findFirst({
          where: eq(accounts.id, oldTx.toAccountId),
        });
        if (oldDestAccount) {
          await db
            .update(accounts)
            .set({ balance: (parseFloat(oldDestAccount.balance) - oldAmount).toFixed(2), updatedAt: new Date() })
            .where(eq(accounts.id, oldDestAccount.id));
        }
      }
      await db
        .update(accounts)
        .set({ balance: srcBal.toFixed(2), updatedAt: new Date() })
        .where(eq(accounts.id, oldSourceAccount.id));
    }

    // 3. Apply new transaction's effect on balances
    const newSourceAccount = await db.query.accounts.findFirst({
      where: eq(accounts.id, accountId),
    });

    if (!newSourceAccount) return NextResponse.json({ error: 'الحساب الجديد غير موجود' }, { status: 400 });

    let newSrcBal = parseFloat(newSourceAccount.balance);
    if (type === 'expense') {
      newSrcBal -= numAmount;
    } else if (type === 'income') {
      newSrcBal += numAmount;
    } else if (type === 'transfer' && toAccountId) {
      newSrcBal -= numAmount;
      const newDestAccount = await db.query.accounts.findFirst({
        where: eq(accounts.id, toAccountId),
      });
      if (newDestAccount) {
        await db
          .update(accounts)
          .set({ balance: (parseFloat(newDestAccount.balance) + numAmount).toFixed(2), updatedAt: new Date() })
          .where(eq(accounts.id, newDestAccount.id));
      }
    }

    await db
      .update(accounts)
      .set({ balance: newSrcBal.toFixed(2), updatedAt: new Date() })
      .where(eq(accounts.id, newSourceAccount.id));

    // 4. Update the transaction record
    await db
      .update(transactions)
      .set({
        type,
        amount: numAmount.toFixed(2),
        accountId: accountId,
        toAccountId: type === 'transfer' ? toAccountId : null,
        categoryId: type !== 'transfer' ? categoryId : null,
        description: description || null,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      })
      .where(eq(transactions.id, transactionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transaction PATCH error:', error);
    return NextResponse.json({ error: 'خطأ أثناء تحديث العملية' }, { status: 500 });
  }
}

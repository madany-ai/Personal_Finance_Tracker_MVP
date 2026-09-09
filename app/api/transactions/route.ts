import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, accounts } from '@/db/schema';
import { getCurrentUser } from '@/lib/session';
import { transactionSchema } from '@/lib/validators';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const accountId = searchParams.get('accountId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const conditions = [eq(transactions.userId, user.id)];
    if (type) conditions.push(eq(transactions.type, type));
    if (accountId) conditions.push(eq(transactions.accountId, parseInt(accountId)));

    const list = await db.query.transactions.findMany({
      where: and(...conditions),
      with: {
        account: true,
        toAccount: true,
        category: true,
      },
      orderBy: [desc(transactions.transactionDate), desc(transactions.createdAt)],
      limit: isNaN(limit) ? 50 : limit,
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json({ error: 'خطأ أثناء جلب العمليات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await req.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' }, { status: 400 });
    }

    const { accountId, toAccountId, categoryId, type, amount, description, transactionDate } = parsed.data;

    // Verify main account ownership
    const sourceAccount = await db.query.accounts.findFirst({
      where: and(eq(accounts.id, accountId), eq(accounts.userId, user.id)),
    });

    if (!sourceAccount) {
      return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 });
    }

    // If transfer, verify destination account ownership
    let destinationAccount = null;
    if (type === 'transfer') {
      if (!toAccountId) {
        return NextResponse.json({ error: 'يرجى تحديد الحساب المحول إليه' }, { status: 400 });
      }
      if (toAccountId === accountId) {
        return NextResponse.json({ error: 'لا يمكن التحويل لنفس الحساب' }, { status: 400 });
      }

      destinationAccount = await db.query.accounts.findFirst({
        where: and(eq(accounts.id, toAccountId), eq(accounts.userId, user.id)),
      });

      if (!destinationAccount) {
        return NextResponse.json({ error: 'الحساب المحول إليه غير موجود' }, { status: 404 });
      }
    }

    // Insert transaction
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        userId: user.id,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : null,
        categoryId: type === 'transfer' ? null : categoryId || null,
        type,
        amount: amount.toFixed(2),
        description: description || null,
        transactionDate: new Date(transactionDate),
      })
      .returning();

    // Update account balances based on transaction type
    const srcBal = parseFloat(sourceAccount.balance);

    if (type === 'expense') {
      const newBal = srcBal - amount;
      await db
        .update(accounts)
        .set({ balance: newBal.toFixed(2), updatedAt: new Date() })
        .where(eq(accounts.id, accountId));
    } else if (type === 'income') {
      const newBal = srcBal + amount;
      await db
        .update(accounts)
        .set({ balance: newBal.toFixed(2), updatedAt: new Date() })
        .where(eq(accounts.id, accountId));
    } else if (type === 'transfer' && destinationAccount) {
      const newSrcBal = srcBal - amount;
      const destBal = parseFloat(destinationAccount.balance);
      const newDestBal = destBal + amount;

      await db
        .update(accounts)
        .set({ balance: newSrcBal.toFixed(2), updatedAt: new Date() })
        .where(eq(accounts.id, accountId));

      await db
        .update(accounts)
        .set({ balance: newDestBal.toFixed(2), updatedAt: new Date() })
        .where(eq(accounts.id, destinationAccount.id));
    }

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error('Transactions POST error:', error);
    return NextResponse.json({ error: 'خطأ أثناء تسجيل العملية' }, { status: 500 });
  }
}

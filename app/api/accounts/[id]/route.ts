import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { accounts, transactions } from '@/db/schema';
import { getCurrentUser } from '@/lib/session';
import { accountSchema } from '@/lib/validators';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const accountId = parseInt(id);
    if (isNaN(accountId)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

    const body = await req.json();
    const parsed = accountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' }, { status: 400 });
    }

    const { name, type, balance } = parsed.data;
    const [updated] = await db
      .update(accounts)
      .set({
        name,
        type,
        balance: balance.toFixed(2),
        updatedAt: new Date(),
      })
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, user.id)))
      .returning();

    if (!updated) return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Account PUT error:', error);
    return NextResponse.json({ error: 'خطأ أثناء تعديل الحساب' }, { status: 500 });
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
    const accountId = parseInt(id);
    if (isNaN(accountId)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

    // Check if there are transactions associated with this account
    const hasTransactions = await db.query.transactions.findFirst({
      where: and(eq(transactions.accountId, accountId), eq(transactions.userId, user.id)),
    });

    if (hasTransactions) {
      return NextResponse.json(
        { error: 'لا يمكن حذف حساب مرتبط بعمليات مالية مسجلة' },
        { status: 400 }
      );
    }

    await db
      .delete(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account DELETE error:', error);
    return NextResponse.json({ error: 'خطأ أثناء حذف الحساب' }, { status: 500 });
  }
}

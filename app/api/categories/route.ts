import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { getCurrentUser } from '@/lib/session';
import { categorySchema } from '@/lib/validators';
import { eq, or, and, isNull } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const userCategories = await db.query.categories.findMany({
      where: or(eq(categories.userId, user.id), isNull(categories.userId)),
    });

    return NextResponse.json(userCategories);
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ error: 'خطأ أثناء جلب التصنيفات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' }, { status: 400 });
    }

    const { name, type } = parsed.data;

    // Check duplicate
    const existing = await db.query.categories.findFirst({
      where: and(eq(categories.userId, user.id), eq(categories.name, name.trim()), eq(categories.type, type)),
    });

    if (existing) {
      return NextResponse.json({ error: 'هذا التصنيف موجود بالفعل' }, { status: 400 });
    }

    const [newCategory] = await db
      .insert(categories)
      .values({
        userId: user.id,
        name: name.trim(),
        type,
        isDefault: false,
      })
      .returning();

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json({ error: 'خطأ أثناء إضافة التصنيف' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '');
    if (isNaN(id)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

    const cat = await db.query.categories.findFirst({
      where: and(eq(categories.id, id), eq(categories.userId, user.id)),
    });

    if (!cat) return NextResponse.json({ error: 'التصنيف غير موجود' }, { status: 404 });
    if (cat.isDefault) {
      return NextResponse.json({ error: 'لا يمكن حذف التصنيفات الافتراضية للنظام' }, { status: 400 });
    }

    await db.delete(categories).where(eq(categories.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Categories DELETE error:', error);
    return NextResponse.json({ error: 'خطأ أثناء حذف التصنيف' }, { status: 500 });
  }
}

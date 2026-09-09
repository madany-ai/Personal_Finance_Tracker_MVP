import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف'),
});

export const accountSchema = z.object({
  name: z.string().min(1, 'اسم الحساب مطلوب'),
  type: z.enum(['bank', 'cash', 'wallet', 'savings', 'other'], {
    message: 'نوع الحساب غير صالح',
  }),
  balance: z.coerce.number(),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'اسم التصنيف مطلوب'),
  type: z.enum(['income', 'expense'], {
    message: 'نوع التصنيف يجب أن يكون دخل أو مصروف',
  }),
});

export const transactionSchema = z.object({
  accountId: z.coerce.number().int().positive('الحساب مطلوب'),
  toAccountId: z.coerce.number().int().positive().optional().nullable(),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  type: z.enum(['income', 'expense', 'transfer'], {
    message: 'نوع العملية غير صالح',
  }),
  amount: z.coerce.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
  description: z.string().optional().nullable(),
  transactionDate: z.string().min(1, 'تاريخ العملية مطلوب'),
});

export const receivableSchema = z.object({
  personName: z.string().min(1, 'اسم الشخص أو الجهة مطلوب'),
  originalAmount: z.coerce.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
  paidAmount: z.coerce.number().min(0).default(0),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(['مستحق', 'مدفوع جزئيًا', 'تم التحصيل', 'متأخر']).default('مستحق'),
});

export const payableSchema = z.object({
  personName: z.string().min(1, 'اسم الشخص أو الجهة مطلوب'),
  originalAmount: z.coerce.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
  paidAmount: z.coerce.number().min(0).default(0),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(['مستحق', 'مدفوع جزئيًا', 'تم السداد', 'متأخر']).default('مستحق'),
});

export const installmentSchema = z.object({
  name: z.string().min(1, 'اسم القسط مطلوب'),
  entity: z.string().optional().nullable(),
  totalAmount: z.coerce.number().positive('إجمالي المبلغ يجب أن يكون أكبر من صفر'),
  installmentCount: z.coerce.number().int().positive('عدد الأقساط يجب أن يكون أكبر من صفر'),
  installmentAmount: z.coerce.number().positive('قيمة القسط يجب أن تكون أكبر من صفر'),
  paidCount: z.coerce.number().int().min(0).default(0),
  paidAmount: z.coerce.number().min(0).default(0),
  firstDate: z.string().min(1, 'تاريخ أول قسط مطلوب'),
  nextDate: z.string().min(1, 'تاريخ القسط القادم مطلوب'),
  frequency: z.enum(['شهري', 'أسبوعي', 'سنوي']).default('شهري'),
});

export const expectedIncomeSchema = z.object({
  source: z.string().min(1, 'مصدر الدخل مطلوب'),
  amount: z.coerce.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
  expectedDate: z.string().min(1, 'تاريخ الوصول المتوقع مطلوب'),
  description: z.string().optional().nullable(),
  status: z.enum(['متوقع', 'وصل', 'متأخر']).default('متوقع'),
});

export const recurringExpenseSchema = z.object({
  name: z.string().min(1, 'اسم المصروف المتكرر مطلوب'),
  amount: z.coerce.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  accountId: z.coerce.number().int().positive().optional().nullable(),
  frequency: z.enum(['شهري', 'أسبوعي', 'سنوي']).default('شهري'),
  nextDueDate: z.string().min(1, 'تاريخ الاستحقاق القادم مطلوب'),
  status: z.enum(['نشط', 'متوقف']).default('نشط'),
});

export const telegramSettingsSchema = z.object({
  botToken: z.string().min(1, 'رمز البوت Bot Token مطلوب'),
  chatId: z.string().min(1, 'معرف المحادثة Chat ID مطلوب'),
});

export const DEFAULT_EXPENSE_CATEGORIES = [
  'الطعام',
  'المواصلات',
  'التسوق',
  'الفواتير',
  'الاشتراكات',
  'البرامج والخدمات',
  'الترفيه',
  'الصحة',
  'التعليم',
  'العائلة',
  'العمل',
  'أخرى',
];

export const DEFAULT_INCOME_CATEGORIES = [
  'الراتب',
  'العمل الحر',
  'العمل التجاري',
  'الاستثمار',
  'هدية',
  'أخرى',
];

export const ACCOUNT_TYPES = [
  { value: 'bank', label: 'حساب بنكي (جاري)' },
  { value: 'cash', label: 'كاش (نقدي ومصاريف)' },
  { value: 'wallet', label: 'محفظة إلكترونية (إنستاباي / كاش)' },
  { value: 'savings', label: 'حساب توفير (شايل فلوس على جنب)' },
  { value: 'emergency', label: 'صندوق طوارئ (احتياطي)' },
  { value: 'investment', label: 'ذهب / شهادات واستثمار' },
  { value: 'other', label: 'أخرى' },
] as const;

export function isSavingsAccountType(type: string): boolean {
  return ['savings', 'emergency', 'investment'].includes(type);
}

export const TRANSACTION_TYPES = [
  { value: 'expense', label: 'مصروف' },
  { value: 'income', label: 'دخل' },
  { value: 'transfer', label: 'تحويل بين حسابات' },
] as const;

export const RECEIVABLE_STATUSES = [
  { value: 'مستحق', label: 'مستحق' },
  { value: 'مدفوع جزئيًا', label: 'مدفوع جزئيًا' },
  { value: 'تم التحصيل', label: 'تم التحصيل' },
  { value: 'متأخر', label: 'متأخر' },
] as const;

export const PAYABLE_STATUSES = [
  { value: 'مستحق', label: 'مستحق' },
  { value: 'مدفوع جزئيًا', label: 'مدفوع جزئيًا' },
  { value: 'تم السداد', label: 'تم السداد' },
  { value: 'متأخر', label: 'متأخر' },
] as const;

export const INSTALLMENT_FREQUENCIES = [
  { value: 'شهري', label: 'شهري' },
  { value: 'أسبوعي', label: 'أسبوعي' },
  { value: 'سنوي', label: 'سنوي' },
] as const;

export const INSTALLMENT_STATUSES = [
  { value: 'نشط', label: 'نشط' },
  { value: 'مكتمل', label: 'مكتمل' },
  { value: 'متأخر', label: 'متأخر' },
] as const;

export const EXPECTED_INCOME_STATUSES = [
  { value: 'متوقع', label: 'متوقع' },
  { value: 'وصل', label: 'وصل' },
  { value: 'متأخر', label: 'متأخر' },
] as const;

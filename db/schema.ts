import { pgTable, serial, text, numeric, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. جدول المستخدمين
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').default('صاحب الحساب'),
  telegramBotToken: text('telegram_bot_token'),
  telegramChatId: text('telegram_chat_id'),
  currency: text('currency').notNull().default('ج.م'),
  targetSavingsRate: integer('target_savings_rate').default(20),
  monthlySavingsGoal: numeric('monthly_savings_goal', { precision: 12, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. جدول الحسابات والمحافظ (البنك، الكاش، محفظة إلكترونية، ...)
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'bank' | 'cash' | 'wallet' | 'savings' | 'other'
  balance: numeric('balance', { precision: 12, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. جدول التصنيفات (دخل ومصروف)
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'income' | 'expense'
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. جدول العمليات المالية (دخل، مصروف، تحويل)
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountId: integer('account_id').references(() => accounts.id, { onDelete: 'restrict' }).notNull(),
  toAccountId: integer('to_account_id').references(() => accounts.id, { onDelete: 'restrict' }), // للتحويل فقط
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  type: text('type').notNull(), // 'income' | 'expense' | 'transfer'
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. جدول أموال مستحقة لي عند الآخرين (Receivables)
export const receivables = pgTable('receivables', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  personName: text('person_name').notNull(),
  originalAmount: numeric('original_amount', { precision: 12, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  remainingAmount: numeric('remaining_amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  status: text('status').notNull().default('مستحق'), // 'مستحق' | 'مدفوع جزئيًا' | 'تم التحصيل' | 'متأخر'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. جدول أموال مستحقة عليّ للآخرين (Payables)
export const payables = pgTable('payables', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  personName: text('person_name').notNull(),
  originalAmount: numeric('original_amount', { precision: 12, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  remainingAmount: numeric('remaining_amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  status: text('status').notNull().default('مستحق'), // 'مستحق' | 'مدفوع جزئيًا' | 'تم السداد' | 'متأخر'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 7. جدول الأقساط (Installments)
export const installments = pgTable('installments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  entity: text('entity'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  installmentCount: integer('installment_count').notNull(),
  installmentAmount: numeric('installment_amount', { precision: 12, scale: 2 }).notNull(),
  paidCount: integer('paid_count').notNull().default(0),
  remainingCount: integer('remaining_count').notNull(),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  remainingAmount: numeric('remaining_amount', { precision: 12, scale: 2 }).notNull(),
  firstDate: timestamp('first_date', { withTimezone: true }).notNull(),
  nextDate: timestamp('next_date', { withTimezone: true }).notNull(),
  frequency: text('frequency').notNull().default('شهري'), // 'شهري' | 'أسبوعي' | 'سنوي'
  status: text('status').notNull().default('نشط'), // 'نشط' | 'مكتمل' | 'متأخر'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 8. جدول الدخل المتوقع (Expected Income)
export const expectedIncome = pgTable('expected_income', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  source: text('source').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  expectedDate: timestamp('expected_date', { withTimezone: true }).notNull(),
  description: text('description'),
  status: text('status').notNull().default('متوقع'), // 'متوقع' | 'وصل' | 'متأخر'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 9. جدول المصاريف المتكررة (Recurring Expenses)
export const recurringExpenses = pgTable('recurring_expenses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  accountId: integer('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  frequency: text('frequency').notNull().default('شهري'), // 'شهري' | 'أسبوعي' | 'سنوي'
  nextDueDate: timestamp('next_due_date', { withTimezone: true }).notNull(),
  status: text('status').notNull().default('نشط'), // 'نشط' | 'متوقف'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  categories: many(categories),
  transactions: many(transactions),
  receivables: many(receivables),
  payables: many(payables),
  installments: many(installments),
  expectedIncome: many(expectedIncome),
  recurringExpenses: many(recurringExpenses),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
    relationName: 'fromAccount',
  }),
  toAccount: one(accounts, {
    fields: [transactions.toAccountId],
    references: [accounts.id],
    relationName: 'toAccount',
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

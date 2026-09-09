export interface DashboardFinancialMetrics {
  currentBalance: number;
  todayIncome: number;
  todayExpense: number;
  todayNet: number;
  monthIncome: number;
  monthExpense: number;
  monthSavings: number;
  savingsRate: number;
  totalReceivables: number;
  totalPayables: number;
  netWorth: number;
  totalExpectedIncome: number;
}

export function calculateSavingsRate(income: number, savings: number): number {
  if (income <= 0) return 0;
  const rate = (savings / income) * 100;
  return Math.round(rate * 10) / 10;
}

export function calculateNetWorth(
  currentBalance: number,
  receivables: number,
  payables: number
): number {
  return currentBalance + receivables - payables;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isSameMonth(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth()
  );
}

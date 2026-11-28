import type { Expense, ExpenseCategory } from "@/src/types/domain";

export const INSIGHT_CATEGORIES: ExpenseCategory[] = [
  "Food",
  "Transport",
  "Rent",
  "Education",
  "Entertainment",
  "Shopping",
  "Technology",
  "Travel",
  "Health",
  "Other",
];

export type CategorySpend = {
  category: ExpenseCategory;
  amountMinor: number;
  sharePercent: number;
};

export type MonthlyInsights = {
  monthLabel: string;
  totalSpentMinor: number;
  previousMonthSpentMinor: number;
  dailyAverageMinor: number;
  daysElapsed: number;
  categories: CategorySpend[];
};

function monthKeyFromExpense(expense: Expense): string {
  if (expense.createdAt) {
    const createdAt = new Date(expense.createdAt);
    if (!Number.isNaN(createdAt.getTime())) return monthKey(createdAt);
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(expense.date)) return expense.date.slice(0, 7);
  return "";
}

function monthKey(date: Date): string {
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

function userShareMinor(expense: Expense, uid: string): number {
  if (!uid || !expense.participants.includes(uid)) return 0;

  if (expense.splits?.length) {
    const ownSplit = expense.splits.find((split) => split.userId === uid);
    return ownSplit ? Math.max(0, Math.round(ownSplit.amount * 100)) : 0;
  }

  const participantCount = Math.max(1, expense.participants.length);
  return Math.max(0, Math.round((expense.amount * 100) / participantCount));
}

function isExpenseCategory(value: string): value is ExpenseCategory {
  return INSIGHT_CATEGORIES.includes(value as ExpenseCategory);
}

export function calculateMonthlyInsights(
  expenses: Expense[],
  uid: string,
  now: Date = new Date(),
): MonthlyInsights {
  const currentMonth = monthKey(now);
  const previousMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const currentTotals = new Map<ExpenseCategory, number>();
  let totalSpentMinor = 0;
  let previousMonthSpentMinor = 0;

  for (const expense of expenses) {
    const expenseMonth = monthKeyFromExpense(expense);
    if (expenseMonth !== currentMonth && expenseMonth !== previousMonth) continue;

    const shareMinor = userShareMinor(expense, uid);
    if (shareMinor <= 0) continue;

    if (expenseMonth === previousMonth) {
      previousMonthSpentMinor += shareMinor;
      continue;
    }

    const category = isExpenseCategory(expense.category) ? expense.category : "Other";
    currentTotals.set(category, (currentTotals.get(category) ?? 0) + shareMinor);
    totalSpentMinor += shareMinor;
  }

  const categories = [...currentTotals.entries()]
    .map(([category, amountMinor]) => ({
      category,
      amountMinor,
      sharePercent: totalSpentMinor > 0 ? (amountMinor / totalSpentMinor) * 100 : 0,
    }))
    .sort((a, b) => b.amountMinor - a.amountMinor);

  const daysElapsed = Math.max(1, now.getDate());
  return {
    monthLabel: now.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    totalSpentMinor,
    previousMonthSpentMinor,
    dailyAverageMinor: Math.round(totalSpentMinor / daysElapsed),
    daysElapsed,
    categories,
  };
}

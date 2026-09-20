import type { ExpenseService } from "@/src/services/api/types";
import type { CreateExpenseInput, Expense, HomeSummary } from "@/src/types/domain";

let expenses: Expense[] = [
  {
    id: "1",
    description: "Dinner with friends",
    amount: 420,
    category: "Food",
    date: "Today",
    paidBy: "You",
    participants: ["You", "Aarav", "Riya"],
    splitMethod: "equal",
    splits: [
      { userId: "You", amount: 140 },
      { userId: "Aarav", amount: 140 },
      { userId: "Riya", amount: 140 },
    ],
  },
  {
    id: "2",
    description: "Uber to college",
    amount: 180,
    category: "Transport",
    date: "Yesterday",
    paidBy: "You",
    participants: ["You"],
    splitMethod: "equal",
    splits: [{ userId: "You", amount: 180 }],
  },
  {
    id: "3",
    description: "Coffee",
    amount: 90,
    category: "Food",
    date: "Yesterday",
    paidBy: "You",
    participants: ["You", "Aarav"],
    splitMethod: "equal",
    splits: [
      { userId: "You", amount: 45 },
      { userId: "Aarav", amount: 45 },
    ],
  },
];

export const mockExpenseService: ExpenseService = {
  async listRecent() {
    return [...expenses];
  },

  async getHomeSummary(): Promise<HomeSummary> {
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return {
      monthLabel: "September",
      totalSpent: Math.max(8420, totalSpent),
      youOwe: 240,
      owedToYou: 680,
    };
  },

  async createExpense(input: CreateExpenseInput): Promise<Expense> {
    const expense: Expense = {
      ...input,
      id: `expense-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    expenses = [expense, ...expenses];
    return expense;
  },
};

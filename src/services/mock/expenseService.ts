import type { ExpenseService } from "@/src/services/api/types";
import type { CreateExpenseInput, Expense, HomeSummary } from "@/src/types/domain";

let expenses: Expense[] = [];

export const mockExpenseService: ExpenseService = {
  async listRecent() {
    return [...expenses];
  },

  async getHomeSummary(): Promise<HomeSummary> {
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return {
      monthLabel: "September",
      totalSpent,
      youOwe: 0,
      owedToYou: 0,
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

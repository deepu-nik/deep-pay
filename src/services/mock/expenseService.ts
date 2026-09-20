import type { ExpenseService } from "@/src/services/api/types";
import type { CreateExpenseInput, Expense, HomeSummary } from "@/src/types/domain";
import { readMockList, writeMockList } from "@/src/services/mock/storage";

const STORAGE_KEY = "@deeppay/mock-expenses";

let expenses: Expense[] | null = null;

async function getExpenses() {
  if (expenses) return expenses;
  expenses = await readMockList<Expense>(STORAGE_KEY, []);
  return expenses;
}

export const mockExpenseService: ExpenseService = {
  async listRecent() {
    return [...await getExpenses()];
  },

  async listByGroup(groupId: string) {
    return (await getExpenses()).filter((expense) => expense.groupId === groupId);
  },

  async getHomeSummary(): Promise<HomeSummary> {
    const current = await getExpenses();
    const totalSpent = current.reduce((sum, expense) => sum + expense.amount, 0);

    return {
      monthLabel: "September",
      totalSpent,
      youOwe: 0,
      owedToYou: 0,
    };
  },

  async createExpense(input: CreateExpenseInput): Promise<Expense> {
    const current = await getExpenses();
    const expense: Expense = {
      ...input,
      id: `expense-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    expenses = [expense, ...current];
    await writeMockList(STORAGE_KEY, expenses);
    return expense;
  },
};

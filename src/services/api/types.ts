import type { CreateExpenseInput, Expense, HomeSummary } from "@/src/types/domain";

export interface ExpenseService {
  listRecent(): Promise<Expense[]>;
  getHomeSummary(): Promise<HomeSummary>;
  createExpense(input: CreateExpenseInput): Promise<Expense>;
}

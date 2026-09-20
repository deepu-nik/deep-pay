import type { CreateExpenseInput, Expense, Friend, HomeSummary } from "@/src/types/domain";

export interface FriendService {
  listFriends(): Promise<Friend[]>;
}

export interface ExpenseService {
  listRecent(): Promise<Expense[]>;
  getHomeSummary(): Promise<HomeSummary>;
  createExpense(input: CreateExpenseInput): Promise<Expense>;
}

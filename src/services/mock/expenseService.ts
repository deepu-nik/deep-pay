import type { ExpenseService } from "@/src/services/api/types";
import type { Expense, HomeSummary } from "@/src/types/domain";

const expenses: Expense[] = [
  { id: "1", description: "Dinner with friends", amount: 420, category: "Food", date: "Today", paidBy: "You", participants: ["You", "Aarav", "Riya"] },
  { id: "2", description: "Uber to college", amount: 180, category: "Transport", date: "Yesterday", paidBy: "You", participants: ["You"] },
  { id: "3", description: "Coffee", amount: 90, category: "Food", date: "Yesterday", paidBy: "You", participants: ["You", "Aarav"] },
];

export const mockExpenseService: ExpenseService = {
  async listRecent() { return expenses; },
  async getHomeSummary(): Promise<HomeSummary> {
    return { monthLabel: "September", totalSpent: 8420, youOwe: 240, owedToYou: 680 };
  },
};

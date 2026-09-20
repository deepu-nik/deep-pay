import type { ExpenseService } from "@/src/services/api/types";
import type { CreateExpenseInput, Expense, GroupBalance, HomeSummary } from "@/src/types/domain";
import { readMockList, writeMockList } from "@/src/services/mock/storage";
import { mockSettlementService } from "@/src/services/mock/settlementService";

const STORAGE_KEY = "@deeppay/mock-expenses";

let expenses: Expense[] | null = null;

async function getExpenses() {
  if (expenses) return expenses;
  expenses = await readMockList<Expense>(STORAGE_KEY, []);
  return expenses;
}

function calculateGroupBalances(expenses: Expense[], settlements: { fromUserId: string; toUserId: string; amount: number }[] = []): GroupBalance[] {
  const byUser = new Map<string, { paid: number; owed: number; settlementNet: number }>();

  const ensure = (userId: string) => {
    const existing = byUser.get(userId);
    if (existing) return existing;
    const next = { paid: 0, owed: 0, settlementNet: 0 };
    byUser.set(userId, next);
    return next;
  };

  for (const expense of expenses) {
    ensure(expense.paidBy).paid += expense.amount;

    if (expense.splits?.length) {
      for (const split of expense.splits) {
        ensure(split.userId).owed += split.amount;
      }
    } else if (expense.participants.length) {
      const share = expense.amount / expense.participants.length;
      for (const userId of expense.participants) {
        ensure(userId).owed += share;
      }
    }
  }

  for (const settlement of settlements) {
    ensure(settlement.fromUserId).settlementNet += settlement.amount;
    ensure(settlement.toUserId).settlementNet -= settlement.amount;
  }

  return [...byUser.entries()].map(([userId, balance]) => ({
    userId,
    paid: Math.round(balance.paid * 100) / 100,
    owed: Math.round(balance.owed * 100) / 100,
    net: Math.round((balance.paid - balance.owed + balance.settlementNet) * 100) / 100,
  }));
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

  async getGroupBalances(groupId: string): Promise<GroupBalance[]> {
    const groupExpenses = (await getExpenses()).filter((expense) => expense.groupId === groupId);
    const groupSettlements = await mockSettlementService.listByGroup(groupId);
    return calculateGroupBalances(groupExpenses, groupSettlements);
  },
};

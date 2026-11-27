import type { ExpenseService } from "@/src/services/api/types";
import type { CreateExpenseInput, Expense, GroupBalance, HomeSummary } from "@/src/types/domain";
import { readMockList, writeMockList } from "@/src/services/mock/storage";
import { mockSettlementService } from "@/src/services/mock/settlementService";
import { mockGroupService } from "@/src/services/mock/groupService";

const STORAGE_KEY = "@deeppay/mock-expenses";
const CURRENT_USER_ID = "You";

let expenses: Expense[] | null = null;

async function getExpenses() {
  if (expenses) return expenses;
  expenses = await readMockList<Expense>(STORAGE_KEY, []);
  return expenses;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function calculateGroupBalances(
  expenses: Expense[],
  settlements: { fromUserId: string; toUserId: string; amount: number }[] = [],
  memberIds: string[] = [],
): GroupBalance[] {
  const byUser = new Map<string, { paid: number; owed: number; settlementNet: number }>();

  const ensure = (userId: string) => {
    const existing = byUser.get(userId);
    if (existing) return existing;
    const next = { paid: 0, owed: 0, settlementNet: 0 };
    byUser.set(userId, next);
    return next;
  };

  // Include every group member, even when they have not participated in an expense yet.
  memberIds.forEach(ensure);

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
    paid: roundMoney(balance.paid),
    owed: roundMoney(balance.owed),
    net: roundMoney(balance.paid - balance.owed + balance.settlementNet),
  }));
}

function getExpenseDate(expense: Expense, now: Date): Date | null {
  if (expense.createdAt) {
    const createdAt = new Date(expense.createdAt);
    if (!Number.isNaN(createdAt.getTime())) return createdAt;
  }

  if (expense.date.toLowerCase() === "today") return now;

  const parsedDate = new Date(expense.date);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getCurrentUserShare(expense: Expense) {
  const ownSplit = expense.splits?.find((split) => split.userId === CURRENT_USER_ID);
  if (ownSplit) return ownSplit.amount;

  if (expense.participants.includes(CURRENT_USER_ID) && expense.participants.length > 0) {
    return expense.amount / expense.participants.length;
  }

  return 0;
}

export const mockExpenseService: ExpenseService = {
  async listRecent() {
    return [...await getExpenses()].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  },

  async listByGroup(groupId: string) {
    return (await getExpenses()).filter((expense) => expense.groupId === groupId);
  },

  async getHomeSummary(): Promise<HomeSummary> {
    const current = await getExpenses();
    const now = new Date();

    // Count each person's share rather than the full bill paid by someone else.
    const totalSpent = current.reduce((sum, expense) => {
      const expenseDate = getExpenseDate(expense, now);
      if (!expenseDate
        || expenseDate.getFullYear() !== now.getFullYear()
        || expenseDate.getMonth() !== now.getMonth()) {
        return sum;
      }
      return sum + getCurrentUserShare(expense);
    }, 0);

    const groups = await mockGroupService.listGroups();
    const balancesByGroup = await Promise.all(groups.map(async (group) => {
      const groupExpenses = current.filter((expense) => expense.groupId === group.id);
      const groupSettlements = await mockSettlementService.listByGroup(group.id);
      return calculateGroupBalances(groupExpenses, groupSettlements, group.memberIds);
    }));

    const yourNetBalances = balancesByGroup
      .flat()
      .filter((balance) => balance.userId === CURRENT_USER_ID);

    const youOwe = yourNetBalances.reduce((sum, balance) => sum + Math.max(0, -balance.net), 0);
    const owedToYou = yourNetBalances.reduce((sum, balance) => sum + Math.max(0, balance.net), 0);

    return {
      monthLabel: now.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      totalSpent: roundMoney(totalSpent),
      youOwe: roundMoney(youOwe),
      owedToYou: roundMoney(owedToYou),
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
    const [current, groups, groupSettlements] = await Promise.all([
      getExpenses(),
      mockGroupService.listGroups(),
      mockSettlementService.listByGroup(groupId),
    ]);
    const group = groups.find((item) => item.id === groupId);
    const groupExpenses = current.filter((expense) => expense.groupId === groupId);
    return calculateGroupBalances(groupExpenses, groupSettlements, group?.memberIds ?? []);
  },
};

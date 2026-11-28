import { mockExpenseService } from "@/src/services/mock/expenseService";
import { mockGroupService } from "@/src/services/mock/groupService";
import { mockSettlementService } from "@/src/services/mock/settlementService";

export type ActivityEntry = {
  id: string;
  kind: "expense" | "settlement";
  title: string;
  detail: string;
  timestamp: number;
  amount: number;
  direction: "out" | "in" | "neutral";
  groupId?: string;
};

function resolveTimestamp(primary?: string, fallback?: string): number {
  const parsedPrimary = primary ? new Date(primary).getTime() : Number.NaN;
  if (Number.isFinite(parsedPrimary)) return parsedPrimary;

  if (fallback?.toLowerCase() === "today") return Date.now();
  const parsedFallback = fallback ? new Date(fallback).getTime() : Number.NaN;
  return Number.isFinite(parsedFallback) ? parsedFallback : 0;
}

export const mockActivityService = {
  async listRecent(): Promise<ActivityEntry[]> {
    const [expenses, groups] = await Promise.all([
      mockExpenseService.listRecent(),
      mockGroupService.listGroups(),
    ]);

    const groupNames = new Map(groups.map((group) => [group.id, group.name]));
    const settlementsByGroup = await Promise.all(
      groups.map((group) => mockSettlementService.listByGroup(group.id)),
    );

    const expenseEntries: ActivityEntry[] = expenses.map((expense) => ({
      id: "expense:" + expense.id,
      kind: "expense",
      title: expense.paidBy === "You"
        ? "You added an expense"
        : expense.paidBy + " added an expense",
      detail: [
        expense.description,
        expense.groupId ? groupNames.get(expense.groupId) ?? "Group expense" : expense.category,
      ].filter(Boolean).join(" · "),
      timestamp: resolveTimestamp(expense.createdAt, expense.date),
      amount: expense.amount,
      direction: expense.paidBy === "You" ? "out" : "neutral",
      ...(expense.groupId ? { groupId: expense.groupId } : {}),
    }));

    const settlementEntries: ActivityEntry[] = settlementsByGroup.flat().map((settlement) => ({
      id: "settlement:" + settlement.id,
      kind: "settlement",
      title: settlement.fromUserId === "You"
        ? "You settled with " + settlement.toUserId
        : settlement.toUserId === "You"
          ? settlement.fromUserId + " settled with you"
          : settlement.fromUserId + " paid " + settlement.toUserId,
      detail: groupNames.get(settlement.groupId) ?? "Group settlement",
      timestamp: resolveTimestamp(settlement.createdAt, settlement.date),
      amount: settlement.amount,
      direction: settlement.fromUserId === "You"
        ? "out"
        : settlement.toUserId === "You"
          ? "in"
          : "neutral",
      groupId: settlement.groupId,
    }));

    return [...expenseEntries, ...settlementEntries]
      .filter((item) => item.timestamp > 0)
      .sort((a, b) => b.timestamp - a.timestamp);
  },
};
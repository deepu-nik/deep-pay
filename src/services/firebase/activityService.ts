import { firebaseAuth } from "@/src/lib/firebase";
import { firebaseExpenseService } from "@/src/services/firebase/expenseService";
import { firebaseGroupService } from "@/src/services/firebase/groupService";
import { firebaseSettlementService } from "@/src/services/firebase/settlementService";

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

export const firebaseActivityService = {
  async listRecent(): Promise<ActivityEntry[]> {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) throw new Error("Sign in to continue.");

    const [expenses, groups] = await Promise.all([
      firebaseExpenseService.listRecent(),
      firebaseGroupService.listGroups(),
    ]);
    const groupNames = new Map(groups.map((group) => [group.id, group.name]));
    const settlementsByGroup = await Promise.all(
      groups.map((group) => firebaseSettlementService.listByGroup(group.id)),
    );

    const expenseEntries: ActivityEntry[] = expenses.map((expense) => ({
      id: "expense:" + expense.id,
      kind: "expense",
      title: expense.paidBy === uid ? "You added an expense" : "A group member added an expense",
      detail: [expense.description, expense.groupId ? groupNames.get(expense.groupId) ?? "Group expense" : expense.category]
        .filter(Boolean)
        .join(" · "),
      timestamp: expense.createdAt ? new Date(expense.createdAt).getTime() : 0,
      amount: expense.amount,
      direction: expense.paidBy === uid ? "out" : "neutral",
      ...(expense.groupId ? { groupId: expense.groupId } : {}),
    }));

    const settlementEntries: ActivityEntry[] = settlementsByGroup.flat().map((settlement) => ({
      id: "settlement:" + settlement.id,
      kind: "settlement",
      title: settlement.fromUserId === uid
        ? "You recorded a payment"
        : settlement.toUserId === uid
          ? "A member recorded a payment to you"
          : "A group settlement was recorded",
      detail: groupNames.get(settlement.groupId) ?? "Group settlement",
      timestamp: settlement.createdAt ? new Date(settlement.createdAt).getTime() : 0,
      amount: settlement.amount,
      direction: settlement.fromUserId === uid ? "out" : settlement.toUserId === uid ? "in" : "neutral",
      groupId: settlement.groupId,
    }));

    return [...expenseEntries, ...settlementEntries]
      .filter((item) => Number.isFinite(item.timestamp) && item.timestamp > 0)
      .sort((a, b) => b.timestamp - a.timestamp);
  },
};

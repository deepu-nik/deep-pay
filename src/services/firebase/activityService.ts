import { firebaseAuth } from "@/src/lib/firebase";
import { withFirestoreTimeout } from "@/src/services/firebase/requestUtils";
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

export type ActivityResult = {
  items: ActivityEntry[];
  groupsUnavailable: boolean;
};

export const firebaseActivityService = {
  async listRecent(): Promise<ActivityResult> {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) throw new Error("Sign in to continue.");

    let groupsUnavailable = false;
    let groups: Awaited<ReturnType<typeof firebaseGroupService.listGroups>> = [];
    try {
      groups = await withFirestoreTimeout(
        firebaseGroupService.listGroups(),
        "Loading your groups took too long. Check your connection and retry.",
      );
    } catch {
      groupsUnavailable = true;
    }

    const expenses = await withFirestoreTimeout(
      firebaseExpenseService.listRecent(groups),
      "Loading activity took too long. Check your connection and retry.",
    );
    const groupNames = new Map(groups.map((group) => [group.id, group.name]));
    const settlementsByGroup = await withFirestoreTimeout(
      Promise.all(groups.map((group) => firebaseSettlementService.listByGroup(group.id))),
      "Loading settlement activity took too long. Check your connection and retry.",
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
      title: settlement.status === "confirmed"
        ? settlement.fromUserId === uid
          ? "You completed a payment"
          : settlement.toUserId === uid
            ? "You received a payment"
            : "A group payment was confirmed"
        : settlement.status === "rejected"
          ? "A payment was marked as not received"
          : settlement.fromUserId === uid
            ? "You marked a payment as sent"
            : "A payment is awaiting confirmation",
      detail: [
        groupNames.get(settlement.groupId) ?? "Group settlement",
        settlement.status === "confirmed"
          ? "Confirmed"
          : settlement.status === "rejected"
            ? "Not received"
            : "Awaiting recipient confirmation",
      ].join(" · "),
      timestamp: settlement.createdAt ? new Date(settlement.createdAt).getTime() : 0,
      amount: settlement.amount,
      direction: settlement.status === "confirmed"
        ? settlement.fromUserId === uid ? "out" : settlement.toUserId === uid ? "in" : "neutral"
        : "neutral",
      groupId: settlement.groupId,
    }));

    const items = [...expenseEntries, ...settlementEntries]
      .filter((item) => Number.isFinite(item.timestamp) && item.timestamp > 0)
      .sort((a, b) => b.timestamp - a.timestamp);

    return { items, groupsUnavailable };
  },
};

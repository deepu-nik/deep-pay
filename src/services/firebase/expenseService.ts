import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { firebaseAuth, firestore } from "@/src/lib/firebase";
import { firebaseGroupService } from "@/src/services/firebase/groupService";
import type {
  CreateExpenseInput,
  Expense,
  GroupBalance,
  HomeSummary,
  PaymentMethod,
} from "@/src/types/domain";

type StoredSplit = { uid: string; amountMinor: number; percentage?: number };

function requireUid() {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error("Sign in to continue.");
  return uid;
}

function timestampToIso(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date(0).toISOString();
}

function normalizeUid(value: string, currentUid: string) {
  return value === "You" ? currentUid : value;
}

function mapExpense(id: string, data: Record<string, unknown>): Expense {
  const amountMinor = typeof data.amountMinor === "number" ? data.amountMinor : 0;
  const splits = Array.isArray(data.splits)
    ? (data.splits as StoredSplit[]).filter((split) => split && typeof split.uid === "string").map((split) => ({
        userId: split.uid,
        amount: (Number(split.amountMinor) || 0) / 100,
        ...(typeof split.percentage === "number" ? { percentage: split.percentage } : {}),
      }))
    : [];
  const paymentMethod = data.paymentMethod;
  return {
    id,
    description: typeof data.description === "string" ? data.description : "Expense",
    amount: amountMinor / 100,
    category: typeof data.category === "string" ? data.category as Expense["category"] : "Other",
    date: typeof data.date === "string" ? data.date : timestampToIso(data.createdAt).slice(0, 10),
    paidBy: typeof data.paidByUid === "string" ? data.paidByUid : "",
    participants: Array.isArray(data.participantUids)
      ? data.participantUids.filter((value): value is string => typeof value === "string")
      : [],
    splitMethod: data.splitMethod === "equal" || data.splitMethod === "custom" || data.splitMethod === "percentage"
      ? data.splitMethod
      : "equal",
    splits,
    notes: typeof data.notes === "string" ? data.notes : undefined,
    groupId: typeof data.groupId === "string" ? data.groupId : undefined,
    paymentMethod: paymentMethod === "cash" || paymentMethod === "upi" || paymentMethod === "card" || paymentMethod === "bank_transfer"
      ? paymentMethod
      : "unknown",
    createdAt: timestampToIso(data.createdAt),
  };
}

function splitToMinor(input: CreateExpenseInput, uid: string, amountMinor: number, participantUids: string[]): StoredSplit[] {
  const rawSplits = input.splits?.length
    ? input.splits
    : (() => {
        const base = Math.floor(amountMinor / participantUids.length);
        const remainder = amountMinor % participantUids.length;
        return participantUids.map((userId, index) => ({
          userId,
          amount: (base + (index < remainder ? 1 : 0)) / 100,
        }));
      })();
  const splits = rawSplits.map((split) => ({
    uid: normalizeUid(split.userId, uid),
    amountMinor: Math.round(split.amount * 100),
    ...(typeof split.percentage === "number" ? { percentage: split.percentage } : {}),
  }));

  const splitTotal = splits.reduce((sum, split) => sum + split.amountMinor, 0);
  const uniqueSplitUids = new Set(splits.map((split) => split.uid));
  if (
    splits.length !== participantUids.length
    || uniqueSplitUids.size !== participantUids.length
    || participantUids.some((participant) => !uniqueSplitUids.has(participant))
    || splits.some((split) => split.amountMinor < 0 || !participantUids.includes(split.uid))
    || splitTotal !== amountMinor
  ) {
    throw new Error("The split amounts must match the expense total and include each participant exactly once.");
  }
  return splits;
}

function calculateBalances(
  expenses: Expense[],
  settlements: { fromUid: string; toUid: string; amountMinor: number; status: string }[],
  memberIds: string[],
): GroupBalance[] {
  const balances = new Map<string, { paid: number; owed: number; settlementNet: number }>();
  const ensure = (uid: string) => {
    let value = balances.get(uid);
    if (!value) {
      value = { paid: 0, owed: 0, settlementNet: 0 };
      balances.set(uid, value);
    }
    return value;
  };

  memberIds.forEach(ensure);
  for (const expense of expenses) {
    ensure(expense.paidBy).paid += Math.round(expense.amount * 100);
    for (const split of expense.splits ?? []) {
      ensure(split.userId).owed += Math.round(split.amount * 100);
    }
  }
  for (const settlement of settlements) {
    if (settlement.status !== "confirmed") continue;
    ensure(settlement.fromUid).settlementNet += settlement.amountMinor;
    ensure(settlement.toUid).settlementNet -= settlement.amountMinor;
  }

  return [...balances.entries()].map(([userId, value]) => ({
    userId,
    paid: value.paid / 100,
    owed: value.owed / 100,
    net: (value.paid - value.owed + value.settlementNet) / 100,
  }));
}

async function listGroupExpenses(groupId: string) {
  const snapshot = await getDocs(collection(firestore, "groups", groupId, "expenses"));
  return snapshot.docs.map((item) => mapExpense(item.id, item.data()));
}

export const firebaseExpenseService = {
  async createExpense(input: CreateExpenseInput): Promise<Expense> {
    const uid = requireUid();
    const amountMinor = Math.round(input.amount * 100);
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
      throw new Error("Enter a valid expense amount greater than ₹0.");
    }
    const description = input.description.trim().replace(/\s+/g, " ");
    if (description.length < 2 || description.length > 80) throw new Error("Add a description between 2 and 80 characters.");

    const paidByUid = normalizeUid(input.paidBy, uid);
    const participantUids = [...new Set(input.participants.map((id) => normalizeUid(id, uid)))];
    if (participantUids.length === 0 || !participantUids.includes(paidByUid)) {
      throw new Error("The payer must be included in the expense participants.");
    }
    const splits = splitToMinor(input, uid, amountMinor, participantUids);
    const paymentMethod: PaymentMethod = input.paymentMethod ?? "unknown";
    const expenseData = {
      description,
      amountMinor,
      category: input.category,
      date: new Date().toISOString().slice(0, 10),
      paidByUid,
      participantUids,
      splits,
      splitMethod: input.splitMethod ?? "equal",
      notes: input.notes ?? "",
      paymentMethod,
      createdByUid: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    let expenseRef = doc(collection(firestore, "users", uid, "expenses"));
    if (input.groupId) {
      const groupSnapshot = await getDoc(doc(firestore, "groups", input.groupId));
      if (!groupSnapshot.exists()) throw new Error("Group not found.");
      const members = groupSnapshot.data().memberUids;
      if (!Array.isArray(members) || !members.includes(uid)) throw new Error("You are not a member of this group.");
      if (participantUids.some((participant) => !members.includes(participant))) {
        throw new Error("Every participant must be a member of the selected group.");
      }
      if (!members.includes(paidByUid)) throw new Error("The payer must be a member of the selected group.");
      expenseRef = doc(collection(firestore, "groups", input.groupId, "expenses"));
      const batch = writeBatch(firestore);
      batch.set(expenseRef, { ...expenseData, groupId: input.groupId });
      await batch.commit();
    } else {
      if (participantUids.length !== 1 || participantUids[0] !== uid || paidByUid !== uid) {
        throw new Error("To split an expense with other people, create a group and invite them first.");
      }
      const batch = writeBatch(firestore);
      batch.set(expenseRef, expenseData);
      await batch.commit();
    }

    return {
      id: expenseRef.id,
      description,
      amount: amountMinor / 100,
      category: input.category,
      date: expenseData.date,
      paidBy: paidByUid,
      participants: participantUids,
      splitMethod: input.splitMethod ?? "equal",
      splits: splits.map((split) => ({
        userId: split.uid,
        amount: split.amountMinor / 100,
        ...(typeof split.percentage === "number" ? { percentage: split.percentage } : {}),
      })),
      groupId: input.groupId,
      paymentMethod,
      createdAt: new Date().toISOString(),
    };
  },

  async listByGroup(groupId: string): Promise<Expense[]> {
    requireUid();
    const expenses = await listGroupExpenses(groupId);
    return expenses.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  },

  async listRecent(): Promise<Expense[]> {
    const uid = requireUid();
    const groups = await firebaseGroupService.listGroups();
    const personalSnapshot = await getDocs(collection(firestore, "users", uid, "expenses"));
    const personal = personalSnapshot.docs.map((item) => mapExpense(item.id, item.data()));
    const groupExpenses = await Promise.all(groups.map((group) => listGroupExpenses(group.id)));
    return [...personal, ...groupExpenses.flat()]
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  },

  async getGroupBalances(groupId: string): Promise<GroupBalance[]> {
    const uid = requireUid();
    const [groupSnapshot, expensesSnapshot, settlementsSnapshot] = await Promise.all([
      getDoc(doc(firestore, "groups", groupId)),
      getDocs(collection(firestore, "groups", groupId, "expenses")),
      getDocs(collection(firestore, "groups", groupId, "settlements")),
    ]);
    if (!groupSnapshot.exists()) throw new Error("Group not found.");
    const group = groupSnapshot.data();
    if (!Array.isArray(group.memberUids) || !group.memberUids.includes(uid)) {
      throw new Error("You are not a member of this group.");
    }

    const expenses = expensesSnapshot.docs.map((item) => mapExpense(item.id, item.data()));
    const settlements = settlementsSnapshot.docs.map((item) => {
      const data = item.data();
      return {
        fromUid: typeof data.fromUid === "string" ? data.fromUid : "",
        toUid: typeof data.toUid === "string" ? data.toUid : "",
        amountMinor: typeof data.amountMinor === "number" ? data.amountMinor : 0,
        status: typeof data.status === "string" ? data.status : "pending",
      };
    });
    return calculateBalances(expenses, settlements, group.memberUids);
  },

  async getHomeSummary(): Promise<HomeSummary> {
    const uid = requireUid();
    const [expenses, groups] = await Promise.all([
      firebaseExpenseService.listRecent(),
      firebaseGroupService.listGroups(),
    ]);
    const now = new Date();
    const totalSpentMinor = expenses.reduce((sum, expense) => {
      const created = expense.createdAt ? new Date(expense.createdAt) : new Date(0);
      if (created.getFullYear() !== now.getFullYear() || created.getMonth() !== now.getMonth()) return sum;
      const ownSplit = expense.splits?.find((split) => split.userId === uid);
      if (ownSplit) return sum + Math.round(ownSplit.amount * 100);
      if (!expense.splits?.length && expense.participants.includes(uid)) {
        return sum + Math.round((expense.amount / expense.participants.length) * 100);
      }
      return sum;
    }, 0);

    const balances = await Promise.all(groups.map((group) => firebaseExpenseService.getGroupBalances(group.id)));
    const ownBalances = balances.flat().filter((balance) => balance.userId === uid);
    const youOweMinor = ownBalances.reduce((sum, balance) => sum + Math.max(0, -Math.round(balance.net * 100)), 0);
    const owedToYouMinor = ownBalances.reduce((sum, balance) => sum + Math.max(0, Math.round(balance.net * 100)), 0);

    return {
      monthLabel: now.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      totalSpent: totalSpentMinor / 100,
      youOwe: youOweMinor / 100,
      owedToYou: owedToYouMinor / 100,
    };
  },
};

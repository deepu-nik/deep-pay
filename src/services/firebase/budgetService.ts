import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firebaseAuth, firestore } from "@/src/lib/firebase";
import type { ExpenseCategory } from "@/src/types/domain";
import { INSIGHT_CATEGORIES } from "@/src/services/analytics/insightsUtils";
import { withFirestoreTimeout } from "@/src/services/firebase/requestUtils";

export type MonthlyBudget = {
  category: ExpenseCategory;
  limitMinor: number;
  updatedAt: string;
};

function requireUid() {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error("Sign in to manage your budgets.");
  return uid;
}

function budgetDocumentId(category: ExpenseCategory) {
  return category.toLowerCase();
}

function timestampToIso(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date(0).toISOString();
}

function isCategory(value: unknown): value is ExpenseCategory {
  return typeof value === "string" && INSIGHT_CATEGORIES.includes(value as ExpenseCategory);
}

function mapBudget(data: Record<string, unknown>): MonthlyBudget | null {
  if (!isCategory(data.category)) return null;
  if (typeof data.limitMinor !== "number" || !Number.isSafeInteger(data.limitMinor) || data.limitMinor <= 0) return null;
  return {
    category: data.category,
    limitMinor: data.limitMinor,
    updatedAt: timestampToIso(data.updatedAt),
  };
}

export const firebaseBudgetService = {
  async listMonthlyBudgets(): Promise<MonthlyBudget[]> {
    const uid = requireUid();
    const snapshot = await withFirestoreTimeout(
      getDocs(collection(firestore, "users", uid, "budgets")),
      "Loading your budgets took too long. Check your connection and retry.",
    );
    return snapshot.docs
      .map((item) => mapBudget(item.data()))
      .filter((budget): budget is MonthlyBudget => budget !== null)
      .sort((a, b) => a.category.localeCompare(b.category));
  },

  async saveMonthlyBudget(input: { category: ExpenseCategory; limitMinor: number }): Promise<MonthlyBudget> {
    const uid = requireUid();
    if (!INSIGHT_CATEGORIES.includes(input.category)) throw new Error("Choose a valid expense category.");
    if (!Number.isSafeInteger(input.limitMinor) || input.limitMinor <= 0 || input.limitMinor > 100000000000) {
      throw new Error("Enter a monthly budget between ₹0.01 and ₹1,000,000,000.");
    }

    await setDoc(doc(firestore, "users", uid, "budgets", budgetDocumentId(input.category)), {
      category: input.category,
      limitMinor: input.limitMinor,
      updatedAt: serverTimestamp(),
    });

    return {
      category: input.category,
      limitMinor: input.limitMinor,
      updatedAt: new Date().toISOString(),
    };
  },

  async removeMonthlyBudget(category: ExpenseCategory): Promise<void> {
    const uid = requireUid();
    await deleteDoc(doc(firestore, "users", uid, "budgets", budgetDocumentId(category)));
  },
};

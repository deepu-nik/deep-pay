import { useCallback, useState } from "react";
import { firebaseExpenseService } from "@/src/services/firebase/expenseService";
import type { CreateExpenseInput, Expense, GroupBalance } from "@/src/types/domain";

export function useExpenses() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExpense = useCallback(async (input: CreateExpenseInput): Promise<Expense | null> => {
    setSaving(true);
    setError(null);
    try {
      return await firebaseExpenseService.createExpense(input);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't save this expense. Please try again.");
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const listByGroup = useCallback((groupId: string): Promise<Expense[]> => {
    return firebaseExpenseService.listByGroup(groupId);
  }, []);

  const getGroupBalances = useCallback((groupId: string): Promise<GroupBalance[]> => {
    return firebaseExpenseService.getGroupBalances(groupId);
  }, []);

  return { createExpense, listByGroup, getGroupBalances, saving, error };
}

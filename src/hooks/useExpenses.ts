import { useCallback, useState } from "react";
import { mockExpenseService } from "@/src/services/mock/expenseService";
import type { CreateExpenseInput, Expense, GroupBalance } from "@/src/types/domain";

export function useExpenses() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExpense = useCallback(async (input: CreateExpenseInput): Promise<Expense | null> => {
    setSaving(true);
    setError(null);
    try {
      return await mockExpenseService.createExpense(input);
    } catch {
      setError("We couldn't save this expense. Please try again.");
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const listByGroup = useCallback(async (groupId: string): Promise<Expense[]> => {
    return mockExpenseService.listByGroup(groupId);
  }, []);

  const getGroupBalances = useCallback(async (groupId: string): Promise<GroupBalance[]> => {
    return mockExpenseService.getGroupBalances(groupId);
  }, []);

  return { createExpense, listByGroup, getGroupBalances, saving, error };
}

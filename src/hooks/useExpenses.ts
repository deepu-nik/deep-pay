import { useState } from "react";
import { mockExpenseService } from "@/src/services/mock/expenseService";
import type { CreateExpenseInput, Expense } from "@/src/types/domain";

export function useExpenses() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createExpense(input: CreateExpenseInput): Promise<Expense | null> {
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
  }

  return { createExpense, saving, error };
}

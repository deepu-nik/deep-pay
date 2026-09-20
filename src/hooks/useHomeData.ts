import { useEffect, useState } from "react";
import { mockExpenseService } from "@/src/services/mock/expenseService";
import type { Expense, HomeSummary } from "@/src/types/domain";

export function useHomeData() {
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([mockExpenseService.getHomeSummary(), mockExpenseService.listRecent()]).then(([nextSummary, nextExpenses]) => {
      if (!active) return;
      setSummary(nextSummary);
      setExpenses(nextExpenses);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return { summary, expenses, loading };
}

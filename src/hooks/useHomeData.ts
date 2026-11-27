import { useCallback, useState } from "react";
import { mockExpenseService } from "@/src/services/mock/expenseService";
import { mockGroupService } from "@/src/services/mock/groupService";
import type { Expense, Group, HomeSummary } from "@/src/types/domain";

export function useHomeData() {
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextSummary, nextExpenses, nextGroups] = await Promise.all([
        mockExpenseService.getHomeSummary(),
        mockExpenseService.listRecent(),
        mockGroupService.listGroups(),
      ]);

      setSummary(nextSummary);
      setExpenses(nextExpenses);
      setGroups(nextGroups);
    } catch {
      setError("We couldn't load your dashboard. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { summary, expenses, groups, loading, error, refresh };
}

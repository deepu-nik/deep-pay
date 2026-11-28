import { useCallback, useState } from "react";
import { firebaseExpenseService } from "@/src/services/firebase/expenseService";
import { firebaseGroupService } from "@/src/services/firebase/groupService";
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
        firebaseExpenseService.getHomeSummary(),
        firebaseExpenseService.listRecent(),
        firebaseGroupService.listGroups(),
      ]);
      setSummary(nextSummary);
      setExpenses(nextExpenses);
      setGroups(nextGroups);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't load your dashboard. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { summary, expenses, groups, loading, error, refresh };
}

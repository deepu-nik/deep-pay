import { useCallback, useRef, useState } from "react";
import { firebaseExpenseService } from "@/src/services/firebase/expenseService";
import { firebaseGroupService } from "@/src/services/firebase/groupService";
import type { Expense, Group, HomeSummary } from "@/src/types/domain";

export function useHomeData() {
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const refresh = useCallback(async () => {
    if (!hasLoaded.current) setLoading(true);
    setError(null);
    try {
      const nextGroups = await firebaseGroupService.listGroups();
      const nextExpenses = await firebaseExpenseService.listRecent(nextGroups);
      const nextSummary = await firebaseExpenseService.getHomeSummary(nextExpenses, nextGroups);
      setSummary(nextSummary);
      setExpenses(nextExpenses);
      setGroups(nextGroups);
      hasLoaded.current = true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't load your dashboard. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { summary, expenses, groups, loading, error, refresh };
}

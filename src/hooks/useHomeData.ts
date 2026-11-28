import { useCallback, useRef, useState } from "react";
import { firebaseExpenseService } from "@/src/services/firebase/expenseService";
import { firebaseGroupService } from "@/src/services/firebase/groupService";
import type { Expense, Group, HomeSummary } from "@/src/types/domain";

export function useHomeData() {
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);
  const groupsLoaded = useRef(false);

  const refresh = useCallback(async () => {
    if (!hasLoaded.current) setLoading(true);
    if (!groupsLoaded.current) setGroupsLoading(true);
    setError(null);
    setGroupsError(null);
    try {
      const nextGroups = await firebaseGroupService.listGroups();
      setGroups(nextGroups);
      groupsLoaded.current = true;
      setGroupsLoading(false);

      const nextExpenses = await firebaseExpenseService.listRecent(nextGroups);
      setExpenses(nextExpenses);
      const nextSummary = await firebaseExpenseService.getHomeSummary(nextExpenses, nextGroups);
      setSummary(nextSummary);
      hasLoaded.current = true;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "We couldn't load your dashboard. Check your connection and try again.";
      setError(message);
      if (!groupsLoaded.current) setGroupsError(message);
    } finally {
      setLoading(false);
      setGroupsLoading(false);
    }
  }, []);

  return { summary, expenses, groups, loading, groupsLoading, groupsError, error, refresh };
}

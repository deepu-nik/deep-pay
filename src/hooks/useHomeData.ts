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

    let nextGroups: Group[] = [];
    try {
      nextGroups = await firebaseGroupService.listGroups();
      groupsLoaded.current = true;
      setGroups(nextGroups);
    } catch {
      groupsLoaded.current = false;
      setGroups([]);
      setGroupsError("Groups are temporarily unavailable.");
    } finally {
      setGroupsLoading(false);
    }

    try {
      // Personal expenses can still load while group access is unavailable.
      const nextExpenses = await firebaseExpenseService.listRecent(nextGroups);
      setExpenses(nextExpenses);
      const nextSummary = await firebaseExpenseService.getHomeSummary(nextExpenses, nextGroups);
      setSummary(nextSummary);
      setError(null);
      hasLoaded.current = true;
    } catch {
      setError("Recent expenses are temporarily unavailable.");
    } finally {
      setLoading(false);
      setGroupsLoading(false);
    }
  }, []);

  return { summary, expenses, groups, loading, groupsLoading, groupsError, error, refresh };
}

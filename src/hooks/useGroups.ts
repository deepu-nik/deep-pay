import { useCallback, useEffect, useState } from "react";
import { mockGroupService } from "@/src/services/mock/groupService";
import type { CreateGroupInput, Group } from "@/src/types/domain";
export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]); const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { setLoading(true); setGroups(await mockGroupService.listGroups()); setLoading(false); }, []);
  useEffect(() => { let active = true; mockGroupService.listGroups().then((next) => { if (active) { setGroups(next); setLoading(false); } }); return () => { active = false; }; }, []);
  const createGroup = useCallback(async (input: CreateGroupInput) => { const group = await mockGroupService.createGroup(input); setGroups((current) => [group, ...current]); return group; }, []);
  const updateGroup = useCallback(async (id: string, input: CreateGroupInput) => { const group = await mockGroupService.updateGroup(id, input); setGroups((current) => current.map((item) => item.id === id ? group : item)); return group; }, []);
  const deleteGroup = useCallback(async (id: string) => { await mockGroupService.deleteGroup(id); setGroups((current) => current.filter((item) => item.id !== id)); }, []);
  return { groups, loading, refresh, createGroup, updateGroup, deleteGroup };
}

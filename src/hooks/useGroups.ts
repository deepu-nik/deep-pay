import { useEffect, useState } from "react";
import { mockGroupService } from "@/src/services/mock/groupService";
import type { CreateGroupInput, Group } from "@/src/types/domain";
export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; mockGroupService.listGroups().then((next) => { if (active) { setGroups(next); setLoading(false); } }); return () => { active = false; }; }, []);
  const createGroup = async (input: CreateGroupInput) => { const group = await mockGroupService.createGroup(input); setGroups((current) => [group, ...current]); return group; };
  return { groups, loading, createGroup };
}

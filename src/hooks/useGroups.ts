import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import {
  firebaseGroupService,
  getGroupInviteDetails,
  type GroupInviteDetails,
} from "@/src/services/firebase/groupService";
import type { CreateGroupInput, Group, GroupMember } from "@/src/types/domain";

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setGroups([]);
      setLoading(false);
      return [];
    }
    setLoading(true);
    setError(null);
    try {
      const next = await firebaseGroupService.listGroups();
      setGroups(next);
      return next;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "We couldn't load your groups.";
      setError(message);
      throw cause;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setGroups([]);
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    firebaseGroupService.listGroups()
      .then((next) => { if (active) setGroups(next); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "We couldn't load your groups.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id]);

  const listMembers = useCallback((groupId: string): Promise<GroupMember[]> => {
    return firebaseGroupService.listMembers(groupId);
  }, []);

  const createGroup = useCallback(async (input: CreateGroupInput) => {
    const group = await firebaseGroupService.createGroup(input);
    setGroups((current) => [group, ...current]);
    return group;
  }, []);

  const updateGroup = useCallback(async (id: string, input: CreateGroupInput) => {
    const group = await firebaseGroupService.updateGroup(id, input);
    setGroups((current) => current.map((item) => item.id === id ? group : item));
    return group;
  }, []);

  const deleteGroup = useCallback(async (id: string) => {
    await firebaseGroupService.deleteGroup(id);
    setGroups((current) => current.filter((item) => item.id !== id));
  }, []);

  const createInvite = useCallback((groupId: string) => firebaseGroupService.createInvite(groupId), []);

  const joinGroupInvite = useCallback(async (inviteId: string) => {
    const groupId = await firebaseGroupService.joinGroupInvite(inviteId);
    await refresh();
    return groupId;
  }, [refresh]);

  const getInviteDetails = useCallback((inviteId: string): Promise<GroupInviteDetails> => {
    return getGroupInviteDetails(inviteId);
  }, []);

  return {
    groups,
    loading,
    error,
    refresh,
    listMembers,
    createGroup,
    updateGroup,
    deleteGroup,
    createInvite,
    joinGroupInvite,
    getInviteDetails,
  };
}

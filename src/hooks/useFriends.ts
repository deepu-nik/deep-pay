import { useEffect, useState } from "react";
import { mockFriendService } from "@/src/services/mock/friendService";
import type { Friend } from "@/src/types/domain";
export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]); const [loading, setLoading] = useState(true);
  const refresh = async () => { setLoading(true); setFriends(await mockFriendService.listFriends()); setLoading(false); };
  const addFriend = async (name: string) => { const friend = await mockFriendService.addFriend(name); setFriends((current) => [...current, friend]); return friend; };
  useEffect(() => { let active = true; mockFriendService.listFriends().then((next) => { if (active) { setFriends(next); setLoading(false); } }); return () => { active = false; }; }, []);
  return { friends, loading, refresh, addFriend };
}

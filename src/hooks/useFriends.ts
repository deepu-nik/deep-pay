import { useEffect, useState } from "react";
import { mockFriendService } from "@/src/services/mock/friendService";
import type { Friend } from "@/src/types/domain";

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    mockFriendService.listFriends().then((nextFriends) => {
      if (!active) return;
      setFriends(nextFriends);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  return { friends, loading };
}

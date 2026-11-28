import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import {
  firebaseFriendService,
  type Friend,
  type FriendHandle,
  type FriendRequest,
} from "@/src/services/firebase/friendService";

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [handle, setHandle] = useState<FriendHandle | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setFriends([]);
      setHandle(null);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [nextHandle, nextFriends, nextRequests] = await Promise.all([
        firebaseFriendService.getMyHandle(),
        firebaseFriendService.listFriends(),
        firebaseFriendService.listRequests(),
      ]);
      setHandle(nextHandle);
      setFriends(nextFriends);
      setIncomingRequests(nextRequests.incoming);
      setOutgoingRequests(nextRequests.outgoing);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't load your friends. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const claimUsername = useCallback(async (username: string) => {
    const nextHandle = await firebaseFriendService.claimUsername(username);
    setHandle(nextHandle);
    return nextHandle;
  }, []);

  const sendFriendRequest = useCallback(async (username: string) => {
    await firebaseFriendService.sendFriendRequest(username);
    await refresh();
  }, [refresh]);

  const respondToRequest = useCallback(async (requestId: string, accept: boolean) => {
    await firebaseFriendService.respondToRequest(requestId, accept);
    await refresh();
  }, [refresh]);

  return {
    friends,
    handle,
    incomingRequests,
    outgoingRequests,
    loading,
    error,
    refresh,
    claimUsername,
    sendFriendRequest,
    respondToRequest,
  };
}

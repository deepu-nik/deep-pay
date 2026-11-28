import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import {
  firebaseFriendService,
  type Friend,
  type FriendHandle,
  type FriendRequest,
} from "@/src/services/firebase/friendService";

function errorText(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [handle, setHandle] = useState<FriendHandle | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);

  // Keep each data source independent. A failed friends-list query must not
  // hide username setup, user search, or incoming request actions.
  const [handleLoading, setHandleLoading] = useState(true);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [handleError, setHandleError] = useState<string | null>(null);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setFriends([]);
      setHandle(null);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setHandleLoading(false);
      setFriendsLoading(false);
      setRequestsLoading(false);
      setHandleError(null);
      setFriendsError(null);
      setRequestsError(null);
      return;
    }

    setHandleLoading(true);
    setFriendsLoading(true);
    setRequestsLoading(true);
    setHandleError(null);
    setFriendsError(null);
    setRequestsError(null);

    const [handleResult, friendsResult, requestsResult] = await Promise.allSettled([
      firebaseFriendService.getMyHandle(),
      firebaseFriendService.listFriends(),
      firebaseFriendService.listRequests(),
    ]);

    if (handleResult.status === "fulfilled") {
      setHandle(handleResult.value);
      setHandleError(null);
    } else {
      setHandleError(errorText(handleResult.reason, "We couldn't check your username. Please retry."));
    }
    setHandleLoading(false);

    if (friendsResult.status === "fulfilled") {
      setFriends(friendsResult.value);
      setFriendsError(null);
    } else {
      setFriendsError(errorText(friendsResult.reason, "We couldn't load your friends. Please retry."));
    }
    setFriendsLoading(false);

    if (requestsResult.status === "fulfilled") {
      setIncomingRequests(requestsResult.value.incoming);
      setOutgoingRequests(requestsResult.value.outgoing);
      setRequestsError(null);
    } else {
      setRequestsError(errorText(requestsResult.reason, "We couldn't load friend requests. Please retry."));
    }
    setRequestsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const claimUsername = useCallback(async (username: string) => {
    const nextHandle = await firebaseFriendService.claimUsername(username, user?.fullName);
    setHandle(nextHandle);
    setHandleError(null);
    return nextHandle;
  }, [user?.fullName]);

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
    handleLoading,
    friendsLoading,
    requestsLoading,
    handleError,
    friendsError,
    requestsError,
    refresh,
    claimUsername,
    sendFriendRequest,
    respondToRequest,
  };
}

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import {
  firebaseFriendService,
  type Friend,
  type FriendHandle,
  type FriendRequest,
} from "@/src/services/firebase/friendService";

function errorText(cause: unknown, fallback: string) {
  if (cause && typeof cause === "object" && "code" in cause) {
    const code = String((cause as { code?: unknown }).code ?? "");
    if (code === "permission-denied" || code === "firestore/permission-denied") {
      return "Firestore permissions need the latest DeepPay rules. Pull the latest branch and run: firebase deploy --only firestore:rules";
    }
    if (code === "unavailable" || code === "deadline-exceeded" || code === "network-request-failed") {
      return "Firebase couldn't be reached. Check your connection and refresh.";
    }
  }
  return cause instanceof Error ? cause.message : fallback;
}

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [handle, setHandle] = useState<FriendHandle | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);

  // Each request owns its loading and error state. Slow or denied list reads
  // must not hold up the username form or the other Friends actions.
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

    const loadHandle = async () => {
      try {
        setHandle(await firebaseFriendService.getMyHandle());
        setHandleError(null);
      } catch (cause) {
        setHandleError(errorText(cause, "We couldn't check your username. Please retry."));
      } finally {
        setHandleLoading(false);
      }
    };

    const loadFriends = async () => {
      try {
        setFriends(await firebaseFriendService.listFriends());
        setFriendsError(null);
      } catch (cause) {
        setFriendsError(errorText(cause, "We couldn't load your friends. Please retry."));
      } finally {
        setFriendsLoading(false);
      }
    };

    const loadRequests = async () => {
      try {
        const nextRequests = await firebaseFriendService.listRequests();
        setIncomingRequests(nextRequests.incoming);
        setOutgoingRequests(nextRequests.outgoing);
        setRequestsError(null);
      } catch (cause) {
        setRequestsError(errorText(cause, "We couldn't load friend requests. Please retry."));
      } finally {
        setRequestsLoading(false);
      }
    };

    await Promise.all([loadHandle(), loadFriends(), loadRequests()]);
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const checkFirestoreConnection = useCallback(async () => {
    return firebaseFriendService.checkFirestoreConnection();
  }, []);

  const claimUsername = useCallback(async (username: string) => {
    const nextHandle = await firebaseFriendService.claimUsername(username, user?.fullName);
    setHandle(nextHandle);
    setHandleError(null);
    return nextHandle;
  }, [user?.fullName]);

  const findUserByUsername = useCallback(async (username: string) => {
    return firebaseFriendService.findUserByUsername(username);
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
    handleLoading,
    friendsLoading,
    requestsLoading,
    handleError,
    friendsError,
    requestsError,
    refresh,
    checkFirestoreConnection,
    claimUsername,
    findUserByUsername,
    sendFriendRequest,
    respondToRequest,
  };
}

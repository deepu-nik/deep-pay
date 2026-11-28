import { FirebaseError, getApp } from "firebase/app";
import {
  Timestamp,
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocFromServer,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { firebaseAuth, firestore } from "@/src/lib/firebase";
import { FIRESTORE_REQUEST_TIMEOUT_MS, withFirestoreTimeout } from "@/src/services/firebase/requestUtils";

export type FriendHandle = {
  uid: string;
  username: string;
  displayName: string;
};

export type Friend = {
  id: string;
  friendshipId: string;
  name: string;
  username: string;
};

export type FriendRequest = {
  id: string;
  fromUid: string;
  toUid: string;
  fromUsername: string;
  toUsername: string;
  fromDisplayName: string;
  toDisplayName: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

function requireUid() {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error("Sign in to find and add friends.");
  return uid;
}

function normalizeUsername(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase();
}

function validateUsername(value: string) {
  const username = normalizeUsername(value);
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    throw new Error("Username must be 3–20 characters and use only letters, numbers or underscores.");
  }
  return username;
}

function requestId(fromUid: string, toUid: string) {
  return fromUid + "__" + toUid;
}

function friendshipId(firstUid: string, secondUid: string) {
  return [firstUid, secondUid].sort().join("__");
}

function timestampToIso(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date(0).toISOString();
}

function mapFriendServiceError(cause: unknown, action: string): Error {
  if (cause instanceof FirebaseError && cause.code === "permission-denied") {
    return new Error(
      "Firestore blocked " + action + ". Pull the latest DeepPay branch, then deploy its rules with: firebase deploy --only firestore:rules",
    );
  }
  if (cause instanceof FirebaseError && (
    cause.code === "unavailable"
    || cause.code === "deadline-exceeded"
    || cause.code === "network-request-failed"
  )) {
    return new Error("Firebase is temporarily unavailable while " + action + ". Check your connection and retry.");
  }
  if (cause instanceof Error) return cause;
  return new Error("We couldn't complete this Friends action. Please retry.");
}

function mapRequest(id: string, data: Record<string, unknown>): FriendRequest | null {
  if (
    typeof data.fromUid !== "string"
    || typeof data.toUid !== "string"
    || typeof data.fromUsername !== "string"
    || typeof data.toUsername !== "string"
    || typeof data.fromDisplayName !== "string"
    || typeof data.toDisplayName !== "string"
  ) return null;

  const status = data.status === "accepted" || data.status === "rejected" ? data.status : "pending";
  return {
    id,
    fromUid: data.fromUid,
    toUid: data.toUid,
    fromUsername: data.fromUsername,
    toUsername: data.toUsername,
    fromDisplayName: data.fromDisplayName,
    toDisplayName: data.toDisplayName,
    status,
    createdAt: timestampToIso(data.createdAt),
  };
}

export const firebaseFriendService = {
  async checkFirestoreConnection(): Promise<{ projectId: string; elapsedMs: number; profileFound: boolean }> {
    const uid = requireUid();
    const projectId = getApp().options.projectId ?? "unknown";
    const startedAt = Date.now();
    try {
      const profileSnapshot = await withFirestoreTimeout(
        getDocFromServer(doc(firestore, "users", uid)),
        "The Firestore server did not respond within 15 seconds. Check the active Firebase project, internet connection, and Firestore database.",
        15_000,
      );
      const elapsedMs = Date.now() - startedAt;
      return { projectId, elapsedMs, profileFound: profileSnapshot.exists() };
    } catch (cause) {
      const elapsedMs = Date.now() - startedAt;
      const code = cause instanceof FirebaseError ? cause.code : "no-server-response";
      const detail = cause instanceof Error ? cause.message : "Unknown Firestore error.";
      console.warn("[Friends] Firestore connection check failed", { projectId, elapsedMs, code, detail });
      if (cause instanceof FirebaseError && cause.code === "permission-denied") {
        throw new Error(
          "Firestore is reachable at project " + projectId + " but denied reading your own users profile (permission-denied). Verify the active project's Firestore rules.",
        );
      }
      if (cause instanceof FirebaseError && cause.code === "unavailable") {
        throw new Error(
          "Firestore project " + projectId + " is unavailable. Check the internet connection and whether the Firestore database is active.",
        );
      }
      throw new Error(
        "Firestore connection check failed for project " + projectId + " after " + elapsedMs + " ms (" + code + "): " + detail,
      );
    }
  },

  async getMyHandle(): Promise<FriendHandle | null> {
    const uid = requireUid();
    const snapshot = await withFirestoreTimeout(
      getDoc(doc(firestore, "userHandles", uid)),
      "Loading your username took too long. Check your connection and retry.",
    );
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    if (
      data.uid !== uid
      || typeof data.username !== "string"
      || typeof data.displayName !== "string"
    ) return null;
    return { uid, username: data.username, displayName: data.displayName };
  },

  async claimUsername(input: string, displayNameInput?: string): Promise<FriendHandle> {
    const uid = requireUid();
    const username = validateUsername(input);
    const displayName = displayNameInput?.trim()
      || firebaseAuth.currentUser?.displayName?.trim()
      || firebaseAuth.currentUser?.email?.split("@")[0]
      || "DeepPay member";

    // Do not pre-read userHandles/{uid} or usernames/{username} here.
    // Those server reads were causing username creation to time out before
    // the write was even attempted. The atomic batch plus Firestore rules
    // enforces one handle per account and one owner per username.
    const handleRef = doc(firestore, "userHandles", uid);
    const userNameRef = doc(firestore, "usernames", username);
    const batch = writeBatch(firestore);
    batch.set(userNameRef, {
      uid,
      username,
      usernameLower: username,
      displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(handleRef, {
      uid,
      username,
      usernameLower: username,
      displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    try {
      await withFirestoreTimeout(
        batch.commit(),
        "Saving your username took too long. Firebase did not confirm the save. Check your connection and retry.",
        FIRESTORE_REQUEST_TIMEOUT_MS,
      );
    } catch (cause) {
      if (cause instanceof FirebaseError && cause.code === "permission-denied") {
        throw new Error(
          "Firestore rejected this username claim. The username may already be taken, this account may already have a username, or the latest Friends rules are not deployed. Run: firebase deploy --only firestore:rules",
        );
      }
      throw mapFriendServiceError(cause, "saving your username");
    }

    return { uid, username, displayName };
  },

  async findUserByUsername(usernameInput: string): Promise<FriendHandle> {
    const uid = requireUid();
    const username = validateUsername(usernameInput);
    const targetSnapshot = await withFirestoreTimeout(
      getDoc(doc(firestore, "usernames", username)),
      "Finding that username took too long. Check your connection and retry.",
    );
    if (!targetSnapshot.exists()) throw new Error("No DeepPay account was found with that username.");
    const targetData = targetSnapshot.data();
    if (typeof targetData.uid !== "string" || typeof targetData.displayName !== "string") {
      throw new Error("That username is not available.");
    }
    if (targetData.uid === uid) throw new Error("That's your own username.");
    return {
      uid: targetData.uid,
      username,
      displayName: targetData.displayName,
    };
  },

  async sendFriendRequest(usernameInput: string): Promise<void> {
    const uid = requireUid();
    const sender = await firebaseFriendService.getMyHandle();
    if (!sender) throw new Error("Choose your DeepPay username before adding friends.");

    const target = await firebaseFriendService.findUserByUsername(usernameInput);
    const pairRef = doc(firestore, "friendships", friendshipId(uid, target.uid));
    const outgoingRef = doc(firestore, "friendRequests", requestId(uid, target.uid));
    const incomingRef = doc(firestore, "friendRequests", requestId(target.uid, uid));
    const [existingFriend, existingRequest, incomingRequest] = await withFirestoreTimeout(
      Promise.all([getDoc(pairRef), getDoc(outgoingRef), getDoc(incomingRef)]),
      "Checking friend status took too long. Check your connection and retry.",
    );
    if (existingFriend.exists()) throw new Error("You're already friends with @" + target.username + ".");
    if (existingRequest.exists()) throw new Error("You've already sent a request to @" + target.username + ".");
    if (incomingRequest.exists() && incomingRequest.data().status === "pending") {
      throw new Error("@" + target.username + " already sent you a request. You can accept it below.");
    }

    try {
      await withFirestoreTimeout(setDoc(outgoingRef, {
        fromUid: uid,
        toUid: target.uid,
        fromUsername: sender.username,
        toUsername: target.username,
        fromDisplayName: sender.displayName,
        toDisplayName: target.displayName,
        status: "pending",
        createdAt: serverTimestamp(),
      }), "Sending this friend request took too long. Check your connection and retry.", FIRESTORE_REQUEST_TIMEOUT_MS);
    } catch (cause) {
      throw mapFriendServiceError(cause, "sending this friend request");
    }
  },

  async listFriends(): Promise<Friend[]> {
    const uid = requireUid();
    const snapshot = await withFirestoreTimeout(
      getDocs(query(collection(firestore, "friendships"), where("memberUids", "array-contains", uid))),
      "Loading your friends took too long. Check your connection and retry.",
    );
    return snapshot.docs
      .map((item) => {
        const members = item.data().members;
        if (!Array.isArray(members)) return null;
        const friendData = members.find((member) => (
          member && typeof member === "object" && "uid" in member && member.uid !== uid
        ));
        if (!friendData || typeof friendData !== "object") return null;
        const data = friendData as Record<string, unknown>;
        if (typeof data.uid !== "string" || typeof data.username !== "string" || typeof data.displayName !== "string") return null;
        return { id: data.uid, friendshipId: item.id, name: data.displayName, username: data.username };
      })
      .filter((friend): friend is Friend => friend !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async removeFriend(friendshipDocumentId: string): Promise<void> {
    const uid = requireUid();
    const friendshipRef = doc(firestore, "friendships", friendshipDocumentId);
    const friendshipSnapshot = await withFirestoreTimeout(
      getDoc(friendshipRef),
      "Opening this friendship took too long. Check your connection and retry.",
    );
    if (!friendshipSnapshot.exists()) return;

    const friendship = friendshipSnapshot.data();
    if (!Array.isArray(friendship.memberUids) || !friendship.memberUids.includes(uid)) {
      throw new Error("You are not allowed to remove this friendship.");
    }

    const batch = writeBatch(firestore);
    batch.delete(friendshipRef);

    if (typeof friendship.requestId === "string") {
      const requestRef = doc(firestore, "friendRequests", friendship.requestId);
      const requestSnapshot = await withFirestoreTimeout(
        getDoc(requestRef),
        "Opening the original friend request took too long. Check your connection and retry.",
      );
      if (
        requestSnapshot.exists()
        && requestSnapshot.data().status === "accepted"
        && (requestSnapshot.data().fromUid === uid || requestSnapshot.data().toUid === uid)
      ) {
        batch.delete(requestRef);
      }
    }

    try {
      await withFirestoreTimeout(
        batch.commit(),
        "Removing this friend took too long. Check your connection and retry.",
        FIRESTORE_REQUEST_TIMEOUT_MS,
      );
    } catch (cause) {
      throw mapFriendServiceError(cause, "removing this friend");
    }
  },

  async listRequests(): Promise<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }> {
    const uid = requireUid();
    const incomingQuery = query(collection(firestore, "friendRequests"), where("toUid", "==", uid));
    const outgoingQuery = query(collection(firestore, "friendRequests"), where("fromUid", "==", uid));
    const [incomingSnapshot, outgoingSnapshot] = await Promise.all([
      withFirestoreTimeout(getDocs(incomingQuery), "Loading friend requests took too long. Check your connection and retry."),
      withFirestoreTimeout(getDocs(outgoingQuery), "Loading friend requests took too long. Check your connection and retry."),
    ]);

    const incoming = incomingSnapshot.docs
      .map((item) => mapRequest(item.id, item.data()))
      .filter((item): item is FriendRequest => Boolean(item && item.status === "pending"))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const outgoing = outgoingSnapshot.docs
      .map((item) => mapRequest(item.id, item.data()))
      .filter((item): item is FriendRequest => Boolean(item && item.status === "pending"))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { incoming, outgoing };
  },

  async respondToRequest(requestKey: string, accept: boolean): Promise<void> {
    const uid = requireUid();
    const requestRef = doc(firestore, "friendRequests", requestKey);
    const snapshot = await withFirestoreTimeout(
      getDoc(requestRef),
      "Opening this friend request took too long. Check your connection and retry.",
    );
    if (!snapshot.exists()) throw new Error("This friend request is no longer available.");
    const request = mapRequest(snapshot.id, snapshot.data());
    if (!request || request.toUid !== uid || request.status !== "pending") {
      throw new Error("This friend request is no longer available.");
    }

    const batch = writeBatch(firestore);
    batch.update(requestRef, {
      status: accept ? "accepted" : "rejected",
      respondedAt: serverTimestamp(),
    });

    if (accept) {
      const friendshipRef = doc(firestore, "friendships", friendshipId(request.fromUid, request.toUid));
      batch.set(friendshipRef, {
        requestId: request.id,
        memberUids: [request.fromUid, request.toUid].sort(),
        members: [
          { uid: request.fromUid, username: request.fromUsername, displayName: request.fromDisplayName },
          { uid: request.toUid, username: request.toUsername, displayName: request.toDisplayName },
        ],
        createdAt: serverTimestamp(),
      });
    }

    try {
      await withFirestoreTimeout(
        batch.commit(),
        "Updating this friend request took too long. Check your connection and retry.",
        FIRESTORE_REQUEST_TIMEOUT_MS,
      );
    } catch (cause) {
      throw mapFriendServiceError(cause, "updating this friend request");
    }
  },
};

import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { firebaseAuth, firestore } from "@/src/lib/firebase";

export type FriendHandle = {
  uid: string;
  username: string;
  displayName: string;
};

export type Friend = {
  id: string;
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

async function withTimeout<T>(promise: Promise<T>, message: string, timeoutMs = 8000): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
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
  async getMyHandle(): Promise<FriendHandle | null> {
    const uid = requireUid();
    const snapshot = await withTimeout(
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

  async claimUsername(input: string): Promise<FriendHandle> {
    const uid = requireUid();
    const username = validateUsername(input);
    const handleRef = doc(firestore, "userHandles", uid);
    const current = await getDoc(handleRef);
    if (current.exists() && current.data().username !== username) {
      throw new Error("Your username is already set and cannot be changed yet.");
    }

    const displayName = firebaseAuth.currentUser?.displayName?.trim()
      || firebaseAuth.currentUser?.email?.split("@")[0]
      || "DeepPay member";
    const userNameRef = doc(firestore, "usernames", username);
    const reserved = await getDoc(userNameRef);
    if (reserved.exists() && reserved.data().uid !== uid) {
      throw new Error("That username is already taken. Try another.");
    }
    const batch = writeBatch(firestore);
    batch.set(userNameRef, {
      uid,
      username,
      usernameLower: username,
      displayName,
      createdAt: current.exists() ? current.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(handleRef, {
      uid,
      username,
      usernameLower: username,
      displayName,
      createdAt: current.exists() ? current.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
    return { uid, username, displayName };
  },

  async sendFriendRequest(usernameInput: string): Promise<void> {
    const uid = requireUid();
    const sender = await firebaseFriendService.getMyHandle();
    if (!sender) throw new Error("Choose your DeepPay username before adding friends.");

    const username = validateUsername(usernameInput);
    const targetSnapshot = await withTimeout(
      getDoc(doc(firestore, "usernames", username)),
      "Finding that username took too long. Check your connection and retry.",
    );
    if (!targetSnapshot.exists()) throw new Error("No DeepPay account was found with that username.");
    const targetData = targetSnapshot.data();
    if (typeof targetData.uid !== "string" || typeof targetData.displayName !== "string") {
      throw new Error("That username is not available.");
    }
    const targetUid = targetData.uid;
    if (targetUid === uid) throw new Error("That's your own username.");

    const pairRef = doc(firestore, "friendships", friendshipId(uid, targetUid));
    const outgoingRef = doc(firestore, "friendRequests", requestId(uid, targetUid));
    const incomingRef = doc(firestore, "friendRequests", requestId(targetUid, uid));
    const [existingFriend, existingRequest, incomingRequest] = await Promise.all([
      getDoc(pairRef),
      getDoc(outgoingRef),
      getDoc(incomingRef),
    ]);
    if (existingFriend.exists()) throw new Error("You're already friends with @" + username + ".");
    if (existingRequest.exists()) throw new Error("You've already sent a request to @" + username + ".");
    if (incomingRequest.exists() && incomingRequest.data().status === "pending") {
      throw new Error("@" + username + " already sent you a request. You can accept it below.");
    }

    await setDoc(outgoingRef, {
      fromUid: uid,
      toUid: targetUid,
      fromUsername: sender.username,
      toUsername: username,
      fromDisplayName: sender.displayName,
      toDisplayName: targetData.displayName,
      status: "pending",
      createdAt: serverTimestamp(),
    });
  },

  async listFriends(): Promise<Friend[]> {
    const uid = requireUid();
    const snapshot = await withTimeout(
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
        return { id: data.uid, name: data.displayName, username: data.username };
      })
      .filter((friend): friend is Friend => friend !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async listRequests(): Promise<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }> {
    const uid = requireUid();
    const incomingQuery = query(collection(firestore, "friendRequests"), where("toUid", "==", uid));
    const outgoingQuery = query(collection(firestore, "friendRequests"), where("fromUid", "==", uid));
    const [incomingSnapshot, outgoingSnapshot] = await Promise.all([
      withTimeout(getDocs(incomingQuery), "Loading friend requests took too long. Check your connection and retry."),
      withTimeout(getDocs(outgoingQuery), "Loading friend requests took too long. Check your connection and retry."),
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
    const snapshot = await getDoc(requestRef);
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

    await batch.commit();
  },
};

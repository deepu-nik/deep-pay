import {
  Timestamp,
  arrayUnion,
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
import { withFirestoreTimeout } from "@/src/services/firebase/requestUtils";
import type { CreateGroupInput, Group, GroupMember } from "@/src/types/domain";

export type GroupInviteDetails = {
  id: string;
  groupId: string;
  groupName: string;
  expiresAt: string;
};

function requireUid() {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error("Sign in to continue.");
  return uid;
}

function currentDisplayName() {
  return firebaseAuth.currentUser?.displayName?.trim() || firebaseAuth.currentUser?.email?.split("@")[0] || "DeepPay member";
}

function timestampToIso(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date(0).toISOString();
}

function mapGroup(id: string, data: Record<string, unknown>): Group {
  return {
    id,
    name: typeof data.name === "string" ? data.name : "Untitled group",
    memberIds: Array.isArray(data.memberUids) ? data.memberUids.filter((value): value is string => typeof value === "string") : [],
    createdAt: timestampToIso(data.createdAt),
    createdByUid: typeof data.createdByUid === "string" ? data.createdByUid : undefined,
  };
}

function normalizeMemberIds(memberIds: string[], uid: string) {
  return [...new Set(memberIds.map((id) => id === "You" ? uid : id))];
}

export const firebaseGroupService = {
  async listGroups(): Promise<Group[]> {
    const uid = requireUid();
    const groupsQuery = query(
      collection(firestore, "groups"),
      where("memberUids", "array-contains", uid),
    );
    const snapshot = await withFirestoreTimeout(
      getDocs(groupsQuery),
      "Loading your groups took too long. Check your connection and tap to retry.",
    );
    return snapshot.docs
      .filter((item) => item.data().status === "active")
      .map((item) => mapGroup(item.id, item.data()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listMembers(groupId: string): Promise<GroupMember[]> {
    requireUid();
    const snapshot = await withFirestoreTimeout(
      getDocs(collection(firestore, "groups", groupId, "members")),
      "Loading group members took too long. Check your connection and retry.",
    );
    return snapshot.docs
      .filter((item) => item.data().status === "active")
      .map((item) => {
        const data = item.data();
        return {
          uid: item.id,
          displayName: typeof data.displayName === "string" ? data.displayName : "DeepPay member",
          role: data.role === "owner" ? "owner" as const : "member" as const,
          joinedAt: timestampToIso(data.joinedAt),
        };
      });
  },

  async createGroup(input: CreateGroupInput): Promise<Group> {
    const uid = requireUid();
    const name = input.name.trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 60) throw new Error("Group name must be between 2 and 60 characters.");

    const requestedMembers = normalizeMemberIds(input.memberIds, uid);
    if (requestedMembers.length !== 1 || requestedMembers[0] !== uid) {
      throw new Error("Create the group first, then invite real DeepPay users with its invite link.");
    }

    const groupRef = doc(collection(firestore, "groups"));
    const memberRef = doc(firestore, "groups", groupRef.id, "members", uid);
    const userMembershipRef = doc(firestore, "users", uid, "groupMemberships", groupRef.id);
    const batch = writeBatch(firestore);
    batch.set(groupRef, {
      name,
      createdByUid: uid,
      memberUids: [uid],
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(memberRef, {
      uid,
      displayName: currentDisplayName(),
      role: "owner",
      status: "active",
      joinedAt: serverTimestamp(),
    });
    batch.set(userMembershipRef, {
      groupId: groupRef.id,
      groupName: name,
      role: "owner",
      joinedAt: serverTimestamp(),
    });
    await batch.commit();

    return {
      id: groupRef.id,
      name,
      memberIds: [uid],
      createdAt: new Date().toISOString(),
      createdByUid: uid,
    };
  },

  async updateGroup(id: string, input: CreateGroupInput): Promise<Group> {
    const uid = requireUid();
    const groupRef = doc(firestore, "groups", id);
    const snapshot = await getDoc(groupRef);
    if (!snapshot.exists()) throw new Error("Group not found.");

    const current = mapGroup(snapshot.id, snapshot.data());
    const requestedMembers = normalizeMemberIds(input.memberIds, uid);
    if (
      requestedMembers.length !== current.memberIds.length
      || requestedMembers.some((memberId) => !current.memberIds.includes(memberId))
    ) {
      throw new Error("Group members can only be changed by joining through a valid invite link.");
    }

    const name = input.name.trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 60) throw new Error("Group name must be between 2 and 60 characters.");
    await updateDoc(groupRef, { name, updatedAt: serverTimestamp() });
    return { ...current, name };
  },

  async deleteGroup(id: string): Promise<void> {
    requireUid();
    await updateDoc(doc(firestore, "groups", id), {
      status: "archived",
      updatedAt: serverTimestamp(),
    });
  },

  async createInvite(groupId: string): Promise<string> {
    const uid = requireUid();
    const groupSnapshot = await getDoc(doc(firestore, "groups", groupId));
    if (!groupSnapshot.exists()) throw new Error("Group not found.");
    const group = groupSnapshot.data();
    if (!Array.isArray(group.memberUids) || !group.memberUids.includes(uid)) {
      throw new Error("Only group members can invite people.");
    }
    if (group.status !== "active") throw new Error("This group is archived.");

    const inviteRef = doc(collection(firestore, "groupInvites"));
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    await setDoc(inviteRef, {
      groupId,
      groupName: typeof group.name === "string" ? group.name : "DeepPay group",
      createdByUid: uid,
      status: "active",
      expiresAt,
      createdAt: serverTimestamp(),
    });
    return inviteRef.id;
  },

  async joinGroupInvite(inviteId: string): Promise<string> {
    const uid = requireUid();
    const inviteSnapshot = await getDoc(doc(firestore, "groupInvites", inviteId));
    if (!inviteSnapshot.exists()) throw new Error("This invite link is invalid or has expired.");

    const invite = inviteSnapshot.data();
    const expiresAt = invite.expiresAt instanceof Timestamp ? invite.expiresAt.toDate().getTime() : 0;
    if (invite.status !== "active" || expiresAt <= Date.now() || typeof invite.groupId !== "string") {
      throw new Error("This invite link is invalid or has expired.");
    }

    const groupId = invite.groupId;
    const memberRef = doc(firestore, "groups", groupId, "members", uid);
    // Rules allow a user to read their own membership document, but not other
    // members' documents until they have joined the group.
    const existingMembership = await getDoc(memberRef);
    if (existingMembership.exists()) return groupId;

    const batch = writeBatch(firestore);
    batch.update(doc(firestore, "groups", groupId), {
      memberUids: arrayUnion(uid),
      lastJoinInviteId: inviteId,
      updatedAt: serverTimestamp(),
    });
    batch.set(memberRef, {
      uid,
      displayName: currentDisplayName(),
      role: "member",
      status: "active",
      joinedAt: serverTimestamp(),
    });
    batch.set(doc(firestore, "users", uid, "groupMemberships", groupId), {
      groupId,
      groupName: typeof invite.groupName === "string" ? invite.groupName : "DeepPay group",
      role: "member",
      joinedAt: serverTimestamp(),
    });
    await batch.commit();
    return groupId;
  },
};

export async function getGroupInviteDetails(inviteId: string): Promise<GroupInviteDetails> {
  requireUid();
  const snapshot = await getDoc(doc(firestore, "groupInvites", inviteId));
  if (!snapshot.exists()) throw new Error("This invite link is invalid or has expired.");
  const data = snapshot.data();
  const expiresAt = data.expiresAt instanceof Timestamp ? data.expiresAt.toDate() : null;
  if (data.status !== "active" || !expiresAt || expiresAt.getTime() <= Date.now()) {
    throw new Error("This invite link is invalid or has expired.");
  }
  return {
    id: snapshot.id,
    groupId: typeof data.groupId === "string" ? data.groupId : "",
    groupName: typeof data.groupName === "string" ? data.groupName : "DeepPay group",
    expiresAt: expiresAt.toISOString(),
  };
}

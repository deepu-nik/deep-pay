import {
  Timestamp,
  arrayUnion,
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  query,
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

    // Read the signed-in user's membership index first. This is an owner-scoped
    // subcollection read and avoids a collection-wide groups query being
    // rejected by Firestore query/rule proof.
    const membershipsSnapshot = await withFirestoreTimeout(
      getDocs(collection(firestore, "users", uid, "groupMemberships")),
      "Loading your group memberships took too long. Check your connection and retry.",
    );
    const groupIds = [...new Set(membershipsSnapshot.docs.map((item) => item.id))];
    if (groupIds.length === 0) return [];

    const groupSnapshots = await withFirestoreTimeout(
      Promise.all(groupIds.map((groupId) => getDoc(doc(firestore, "groups", groupId)))),
      "Loading your groups took too long. Check your connection and retry.",
    );

    return groupSnapshots
      .filter((snapshot) => snapshot.exists())
      .filter((snapshot) => {
        const data = snapshot.data();
        return data.status === "active"
          && Array.isArray(data.memberUids)
          && data.memberUids.includes(uid);
      })
      .map((snapshot) => mapGroup(snapshot.id, snapshot.data()))
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
    try {
      await withFirestoreTimeout(
        batch.commit(),
        "Creating this group took too long. Check your connection and try again.",
      );
    } catch (cause) {
      const code = cause && typeof cause === "object" && "code" in cause
        ? String((cause as { code?: unknown }).code ?? "")
        : "";
      if (code === "permission-denied" || code === "firestore/permission-denied") {
        throw new Error(
          "Firestore denied group creation. Publish the latest DeepPay rules with: firebase deploy --only firestore:rules --project deeppay-d3df2",
        );
      }
      throw cause;
    }

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

  async archiveGroup(id: string): Promise<void> {
    const uid = requireUid();
    const groupRef = doc(firestore, "groups", id);
    const groupSnapshot = await withFirestoreTimeout(
      getDoc(groupRef),
      "Opening this group took too long. Check your connection and retry.",
    );
    if (!groupSnapshot.exists()) throw new Error("Group not found.");
    if (groupSnapshot.data().createdByUid !== uid) {
      throw new Error("Only the group owner can archive this group.");
    }
    await withFirestoreTimeout(
      updateDoc(groupRef, { status: "archived", updatedAt: serverTimestamp() }),
      "Archiving this group took too long. Check your connection and retry.",
    );
  },

  async deleteGroup(id: string): Promise<void> {
    const uid = requireUid();
    const groupRef = doc(firestore, "groups", id);
    const groupSnapshot = await withFirestoreTimeout(
      getDoc(groupRef),
      "Opening this group took too long. Check your connection and retry.",
    );
    if (!groupSnapshot.exists()) throw new Error("Group not found.");

    const groupData = groupSnapshot.data();
    if (groupData.createdByUid !== uid) {
      throw new Error("Only the group owner can permanently delete this group.");
    }
    const memberUids = Array.isArray(groupData.memberUids)
      ? [...new Set(groupData.memberUids.filter((value): value is string => typeof value === "string"))]
      : [uid];
    if (!memberUids.includes(uid)) {
      throw new Error("You are no longer a member of this group.");
    }

    const membersRef = collection(firestore, "groups", id, "members");
    const expensesRef = collection(firestore, "groups", id, "expenses");
    const settlementsRef = collection(firestore, "groups", id, "settlements");
    const invitesQuery = query(
      collection(firestore, "groupInvites"),
      where("groupId", "==", id),
    );

    const [membersSnapshot, expensesSnapshot, settlementsSnapshot, invitesSnapshot] = await withFirestoreTimeout(
      Promise.all([
        getDocs(membersRef),
        getDocs(expensesRef),
        getDocs(settlementsRef),
        getDocs(invitesQuery),
      ]),
      "Preparing group deletion took too long. Check your connection and retry.",
    );

    // Revoke live invitations first so old links cannot be used after deletion.
    const relevantInvites = invitesSnapshot.docs.filter((item) => item.data().groupId === id && item.data().status === "active");
    for (let index = 0; index < relevantInvites.length; index += 400) {
      const batch = writeBatch(firestore);
      relevantInvites.slice(index, index + 400).forEach((item) => {
        batch.update(item.ref, { status: "revoked" });
      });
      await withFirestoreTimeout(
        batch.commit(),
        "Revoking group invitations took too long. Check your connection and retry.",
      );
    }

    // Delete all child documents and membership indexes in bounded batches.
    // The parent group remains until the final write, so owner checks stay valid.
    const refs = [
      ...membersSnapshot.docs.map((item) => item.ref),
      ...expensesSnapshot.docs.map((item) => item.ref),
      ...settlementsSnapshot.docs.map((item) => item.ref),
      ...memberUids.map((memberUid) => doc(firestore, "users", memberUid, "groupMemberships", id)),
    ];
    for (let index = 0; index < refs.length; index += 400) {
      const batch = writeBatch(firestore);
      refs.slice(index, index + 400).forEach((reference) => batch.delete(reference));
      await withFirestoreTimeout(
        batch.commit(),
        "Removing group records took too long. Check your connection and retry.",
      );
    }

    await withFirestoreTimeout(
      deleteDoc(groupRef),
      "Finishing group deletion took too long. Check your connection and retry.",
    );
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

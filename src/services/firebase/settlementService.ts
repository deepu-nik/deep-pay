import {
  Timestamp,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { firebaseAuth, firestore } from "@/src/lib/firebase";
import type { CreateSettlementInput, Settlement } from "@/src/types/domain";

function requireUid() {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error("Sign in to continue.");
  return uid;
}

function timestampToIso(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date(0).toISOString();
}

function mapSettlement(id: string, data: Record<string, unknown>): Settlement {
  return {
    id,
    groupId: typeof data.groupId === "string" ? data.groupId : "",
    fromUserId: typeof data.fromUid === "string" ? data.fromUid : "",
    toUserId: typeof data.toUid === "string" ? data.toUid : "",
    amount: (typeof data.amountMinor === "number" ? data.amountMinor : 0) / 100,
    date: typeof data.date === "string" ? data.date : timestampToIso(data.createdAt).slice(0, 10),
    createdAt: timestampToIso(data.createdAt),
    status: data.status === "confirmed" || data.status === "rejected" ? data.status : "payer_marked_paid",
    paymentMethod: data.paymentMethod === "upi" ? "upi" : "cash",
    reference: typeof data.reference === "string" ? data.reference : undefined,
  };
}

export const firebaseSettlementService = {
  async listByGroup(groupId: string): Promise<Settlement[]> {
    requireUid();
    const snapshot = await getDocs(collection(firestore, "groups", groupId, "settlements"));
    return snapshot.docs
      .map((item) => mapSettlement(item.id, { ...item.data(), groupId }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createSettlement(input: CreateSettlementInput): Promise<Settlement> {
    const uid = requireUid();
    const fromUid = input.fromUserId === "You" ? uid : input.fromUserId;
    const toUid = input.toUserId === "You" ? uid : input.toUserId;
    const amountMinor = Math.round(input.amount * 100);
    if (fromUid !== uid) throw new Error("You can only record a settlement that you initiated.");
    if (!toUid || toUid === fromUid || !Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
      throw new Error("Enter a valid settlement recipient and amount.");
    }

    const settlementRef = doc(collection(firestore, "groups", input.groupId, "settlements"));
    const batch = writeBatch(firestore);
    batch.set(settlementRef, {
      fromUid,
      toUid,
      amountMinor,
      date: input.date,
      paymentMethod: input.paymentMethod ?? "cash",
      status: "payer_marked_paid",
      createdByUid: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();

    return {
      id: settlementRef.id,
      groupId: input.groupId,
      fromUserId: fromUid,
      toUserId: toUid,
      amount: amountMinor / 100,
      date: input.date,
      createdAt: new Date().toISOString(),
      status: "payer_marked_paid",
      paymentMethod: input.paymentMethod ?? "cash",
    };
  },

  async confirmSettlement(groupId: string, settlementId: string): Promise<void> {
    requireUid();
    await updateDoc(doc(firestore, "groups", groupId, "settlements", settlementId), {
      status: "confirmed",
      recipientConfirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },
};

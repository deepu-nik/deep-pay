import { FirebaseError } from "firebase/app";
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firebaseAuth, firestore } from "@/src/lib/firebase";
import { isValidVpa, normalizeVpa } from "@/src/services/upi/upiUtils";

export type UpiProfile = {
  vpa: string;
  displayName: string;
  updatedAt: string;
};

export type UpiTransaction = {
  id: string;
  payeeVpa: string;
  payeeName: string;
  amountMinor: number;
  note?: string;
  transactionReference?: string;
  status: "payer_reported";
  source: "scanned_qr" | "manual_vpa";
  createdAt: string;
};

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

function mapTransaction(id: string, data: Record<string, unknown>): UpiTransaction {
  return {
    id,
    payeeVpa: typeof data.payeeVpa === "string" ? data.payeeVpa : "",
    payeeName: typeof data.payeeName === "string" ? data.payeeName : "UPI recipient",
    amountMinor: typeof data.amountMinor === "number" ? data.amountMinor : 0,
    note: typeof data.note === "string" ? data.note : undefined,
    transactionReference: typeof data.transactionReference === "string" ? data.transactionReference : undefined,
    status: "payer_reported",
    source: data.source === "scanned_qr" ? "scanned_qr" : "manual_vpa",
    createdAt: timestampToIso(data.createdAt),
  };
}

export const firebaseUpiService = {
  async getMyProfile(): Promise<UpiProfile | null> {
    const uid = requireUid();
    const snapshot = await getDoc(doc(firestore, "users", uid, "paymentProfiles", "upi"));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    if (typeof data.vpa !== "string" || typeof data.displayName !== "string") return null;
    return {
      vpa: data.vpa,
      displayName: data.displayName,
      updatedAt: timestampToIso(data.updatedAt),
    };
  },

  async saveMyProfile(input: { vpa: string; displayName: string }): Promise<UpiProfile> {
    const uid = requireUid();
    const vpa = normalizeVpa(input.vpa);
    const displayName = input.displayName.trim().replace(/\s+/g, " ");
    if (!isValidVpa(vpa)) throw new Error("Enter a valid UPI ID, for example name@bank.");
    if (displayName.length < 2 || displayName.length > 80) throw new Error("Display name must be between 2 and 80 characters.");

    try {
      await setDoc(doc(firestore, "users", uid, "paymentProfiles", "upi"), {
        vpa,
        displayName,
        updatedAt: serverTimestamp(),
      });
    } catch (cause) {
      if (cause instanceof FirebaseError && cause.code === "permission-denied") {
        throw new Error(
          "Firebase denied saving your UPI profile. Deploy the latest Firestore rules from this branch using: firebase deploy --only firestore:rules",
        );
      }
      if (cause instanceof FirebaseError && (
        cause.code === "unavailable"
        || cause.code === "deadline-exceeded"
        || cause.code === "network-request-failed"
      )) {
        throw new Error("Couldn't reach Firebase to save your UPI details. Check your internet connection and try again.");
      }
      throw cause;
    }

    return { vpa, displayName, updatedAt: new Date().toISOString() };
  },

  async recordOutgoing(input: {
    payeeVpa: string;
    payeeName: string;
    amountMinor: number;
    note?: string;
    transactionReference?: string;
    source: "scanned_qr" | "manual_vpa";
  }): Promise<UpiTransaction> {
    const uid = requireUid();
    const payeeVpa = normalizeVpa(input.payeeVpa);
    const payeeName = input.payeeName.trim().replace(/\s+/g, " ");
    if (!isValidVpa(payeeVpa)) throw new Error("The recipient UPI ID is not valid.");
    if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) throw new Error("Enter a valid payment amount.");
    if (payeeName.length < 2 || payeeName.length > 80) throw new Error("Enter a valid recipient name.");
    const note = input.note?.trim().slice(0, 80) ?? "";
    const transactionReference = input.transactionReference?.trim().slice(0, 64) ?? "";

    const transactionRef = doc(collection(firestore, "users", uid, "upiTransactions"));
    await setDoc(transactionRef, {
      payeeVpa,
      payeeName,
      amountMinor: input.amountMinor,
      note,
      transactionReference,
      source: input.source,
      status: "payer_reported",
      createdByUid: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: transactionRef.id,
      payeeVpa,
      payeeName,
      amountMinor: input.amountMinor,
      note: note || undefined,
      transactionReference: transactionReference || undefined,
      source: input.source,
      status: "payer_reported",
      createdAt: new Date().toISOString(),
    };
  },

  async listRecentTransactions(): Promise<UpiTransaction[]> {
    const uid = requireUid();
    const snapshot = await getDocs(collection(firestore, "users", uid, "upiTransactions"));
    return snapshot.docs
      .map((item) => mapTransaction(item.id, item.data()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 30);
  },
};

import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { FIRESTORE_REQUEST_TIMEOUT_MS, withFirestoreTimeout } from "@/src/services/firebase/requestUtils";
import { withFirestoreTimeout } from "@/src/services/firebase/requestUtils";
import { isValidVpa, normalizeVpa } from "@/src/services/upi/upiUtils";

export type UpiProfile = {
  vpa: string;
  displayName: string;
  updatedAt: string;
  syncStatus: "local" | "synced";
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

const profileStorageKey = (uid: string) => `@deeppay/upi-profile:v1:${uid}`;

function isStoredProfile(value: unknown): value is UpiProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<UpiProfile>;
  return typeof profile.vpa === "string"
    && isValidVpa(profile.vpa)
    && typeof profile.displayName === "string"
    && profile.displayName.length >= 2
    && (profile.syncStatus === "local" || profile.syncStatus === "synced");
}

function profileSyncError(cause: unknown) {
  if (cause instanceof FirebaseError && cause.code === "permission-denied") {
    return "Saved on this device, but Firebase rejected account sync. Deploy the latest rules with: firebase deploy --only firestore:rules";
  }
  if (cause instanceof FirebaseError && (
    cause.code === "unavailable"
    || cause.code === "deadline-exceeded"
    || cause.code === "network-request-failed"
  )) {
    return "Saved on this device. Firebase is unreachable right now, so account sync will need to be retried.";
  }
  if (cause instanceof Error && cause.message.includes("timed out")) {
    return "Saved on this device. Firebase did not respond in time; retry account sync when your connection is stable.";
  }
  return cause instanceof Error
    ? `Saved on this device, but account sync failed: ${cause.message}`
    : "Saved on this device, but account sync failed.";
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
    const key = profileStorageKey(uid);
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (isStoredProfile(parsed)) return parsed;
      } catch {
        // Ignore a corrupt local cache and continue with the account copy.
      }
    }

    const snapshot = await withFirestoreTimeout(
      getDoc(doc(firestore, "users", uid, "paymentProfiles", "upi")),
      "Loading your UPI profile timed out. Check your connection and retry.",
      FIRESTORE_REQUEST_TIMEOUT_MS,
    );
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    if (typeof data.vpa !== "string" || typeof data.displayName !== "string") return null;
    const profile: UpiProfile = {
      vpa: data.vpa,
      displayName: data.displayName,
      updatedAt: timestampToIso(data.updatedAt),
      syncStatus: "synced",
    };
    await AsyncStorage.setItem(key, JSON.stringify(profile));
    return profile;
  },

  async saveMyProfile(input: { vpa: string; displayName: string }): Promise<UpiProfile> {
    const uid = requireUid();
    const vpa = normalizeVpa(input.vpa);
    const displayName = input.displayName.trim().replace(/\\s+/g, " ");
    if (!isValidVpa(vpa)) throw new Error("Enter a valid UPI ID, for example name@bank.");
    if (displayName.length < 2 || displayName.length > 80) throw new Error("Display name must be between 2 and 80 characters.");

    const profile: UpiProfile = {
      vpa,
      displayName,
      updatedAt: new Date().toISOString(),
      syncStatus: "local",
    };
    await AsyncStorage.setItem(profileStorageKey(uid), JSON.stringify(profile));
    return profile;
  },

  async syncMyProfile(profile: UpiProfile): Promise<UpiProfile> {
    const uid = requireUid();
    await withFirestoreTimeout(
      setDoc(doc(firestore, "users", uid, "paymentProfiles", "upi"), {
        vpa: profile.vpa,
        displayName: profile.displayName,
        updatedAt: serverTimestamp(),
      }),
      "Firebase profile sync timed out.",
      FIRESTORE_REQUEST_TIMEOUT_MS,
    );
    const synced: UpiProfile = { ...profile, syncStatus: "synced", updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem(profileStorageKey(uid), JSON.stringify(synced));
    return synced;
  },

  getProfileSyncError: profileSyncError,
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
    const snapshot = await withFirestoreTimeout(
      getDocs(collection(firestore, "users", uid, "upiTransactions")),
      "Loading payment history took too long. Check your connection and retry.",
    );
    return snapshot.docs
      .map((item) => mapTransaction(item.id, item.data()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 30);
  },
};

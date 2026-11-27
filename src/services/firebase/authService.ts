import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { firebaseAuth, firestore } from "@/src/lib/firebase";
import type { AuthUser, CreateProfileInput } from "@/src/types/auth";

type ProfileDocument = {
  fullName?: unknown;
  email?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function timestampToIso(value: unknown, fallback: string) {
  if (
    value
    && typeof value === "object"
    && "toDate" in value
    && typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }

  return typeof value === "string" ? value : fallback;
}

function toAuthUser(user: FirebaseUser, profile?: ProfileDocument): AuthUser {
  const now = new Date().toISOString();
  const email = user.email ?? (typeof profile?.email === "string" ? profile.email : "");
  const fullName = typeof profile?.fullName === "string"
    ? profile.fullName
    : user.displayName ?? email.split("@")[0] ?? "DeepPay user";

  return {
    id: user.uid,
    fullName,
    email,
    createdAt: timestampToIso(
      profile?.createdAt,
      user.metadata.creationTime ?? now,
    ),
    updatedAt: timestampToIso(profile?.updatedAt, now),
  };
}

function toUserFacingError(error: unknown) {
  const code = (
    error
    && typeof error === "object"
    && "code" in error
    && typeof error.code === "string"
  ) ? error.code : "";

  const messages: Record<string, string> = {
    "auth/email-already-in-use": "An account already exists for this email. Sign in instead.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/user-not-found": "No account was found for this email.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/weak-password": "Choose a stronger password with at least 8 characters.",
    "auth/too-many-requests": "Too many attempts. Please wait a little and try again.",
    "auth/network-request-failed": "Network error. Check your internet connection and try again.",
    "auth/operation-not-allowed": "Email/password sign-in is disabled. Enable it in Firebase Authentication settings.",
    "auth/user-disabled": "This account has been disabled.",
    "firestore/permission-denied": "Firestore denied access. Check that the Firestore database exists and the project's security rules have been deployed.",
    "permission-denied": "Firestore denied access. Check that the Firestore database exists and the project's security rules have been deployed.",
    "unavailable": "Firebase is temporarily unavailable. Please try again.",
  };

  const message = messages[code]
    ?? (error instanceof Error ? error.message : "Something went wrong. Please try again.");
  return new Error(message);
}

async function ensureUserProfile(user: FirebaseUser): Promise<AuthUser> {
  const profileRef = doc(firestore, "users", user.uid);
  const snapshot = await getDoc(profileRef);

  if (snapshot.exists()) {
    return toAuthUser(user, snapshot.data() as ProfileDocument);
  }

  const profile = toAuthUser(user);
  await setDoc(profileRef, {
    fullName: profile.fullName,
    email: profile.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return profile;
}

export const firebaseAuthService = {
  subscribe(
    onUserChanged: (user: AuthUser | null) => void,
    onError?: (error: Error) => void,
  ) {
    return onAuthStateChanged(
      firebaseAuth,
      (firebaseUser) => {
        if (!firebaseUser) {
          onUserChanged(null);
          return;
        }

        void ensureUserProfile(firebaseUser)
          .then(onUserChanged)
          .catch((error: unknown) => {
            onError?.(toUserFacingError(error));
            // Keep the authenticated user available even if the profile read
            // is temporarily unavailable. Profile writes will still surface
            // the Firestore error to the user.
            onUserChanged(toAuthUser(firebaseUser));
          });
      },
      (error) => onError?.(toUserFacingError(error)),
    );
  },

  async createProfile(input: CreateProfileInput): Promise<AuthUser> {
    const fullName = input.fullName.trim().replace(/\s+/g, " ");
    const email = normalizeEmail(input.email);

    if (fullName.length < 2) throw new Error("Enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
    if (input.password.length < 8) throw new Error("Choose a password with at least 8 characters.");

    let user: FirebaseUser | null = null;

    try {
      const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        input.password,
      );
      user = credential.user;

      await updateProfile(user, { displayName: fullName });

      const now = new Date().toISOString();
      await setDoc(doc(firestore, "users", user.uid), {
        fullName,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        id: user.uid,
        fullName,
        email,
        createdAt: user.metadata.creationTime ?? now,
        updatedAt: now,
      };
    } catch (error) {
      // Avoid leaving an Auth account without its required Firestore profile
      // if profile creation fails (for example, when rules are not deployed).
      if (user) await deleteUser(user).catch(() => undefined);
      throw toUserFacingError(error);
    }
  },

  async signInWithEmail(emailValue: string, password: string): Promise<AuthUser> {
    const email = normalizeEmail(emailValue);
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
    if (!password) throw new Error("Enter your password.");

    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return await ensureUserProfile(credential.user);
    } catch (error) {
      throw toUserFacingError(error);
    }
  },

  async resetPassword(emailValue: string): Promise<void> {
    const email = normalizeEmail(emailValue);
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter your email address first.");

    try {
      await sendPasswordResetEmail(firebaseAuth, email);
    } catch (error) {
      throw toUserFacingError(error);
    }
  },

  async updateFullName(value: string): Promise<AuthUser> {
    const fullName = value.trim().replace(/\s+/g, " ");
    if (fullName.length < 2) throw new Error("Name must contain at least 2 characters.");

    const user = firebaseAuth.currentUser;
    if (!user) throw new Error("Your session has expired. Sign in again.");

    try {
      await ensureUserProfile(user);
      await updateProfile(user, { displayName: fullName });
      await updateDoc(doc(firestore, "users", user.uid), {
        fullName,
        updatedAt: serverTimestamp(),
      });

      const updated = await getDoc(doc(firestore, "users", user.uid));
      return toAuthUser(user, updated.data() as ProfileDocument | undefined);
    } catch (error) {
      throw toUserFacingError(error);
    }
  },

  async signOut(): Promise<void> {
    try {
      await signOut(firebaseAuth);
    } catch (error) {
      throw toUserFacingError(error);
    }
  },
};

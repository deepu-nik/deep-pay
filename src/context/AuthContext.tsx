import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { firebaseAuthService } from "@/src/services/firebase/authService";
import type { AuthUser, CreateProfileInput } from "@/src/types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  createProfile: (input: CreateProfileInput) => Promise<AuthUser>;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  resetPassword: (email: string) => Promise<void>;
  updateFullName: (fullName: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => firebaseAuthService.subscribe(
    (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    },
    (error) => {
      console.warn("[auth] Firebase state observer error:", error.message);
      setLoading(false);
    },
  ), []);

  const createProfile = useCallback(async (input: CreateProfileInput) => {
    const nextUser = await firebaseAuthService.createProfile(input);
    setUser(nextUser);
    return nextUser;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const nextUser = await firebaseAuthService.signInWithEmail(email, password);
    setUser(nextUser);
    return nextUser;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await firebaseAuthService.resetPassword(email);
  }, []);

  const updateFullName = useCallback(async (fullName: string) => {
    const nextUser = await firebaseAuthService.updateFullName(fullName);
    setUser(nextUser);
    return nextUser;
  }, []);

  const signOut = useCallback(async () => {
    await firebaseAuthService.signOut();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    createProfile,
    signIn,
    resetPassword,
    updateFullName,
    signOut,
  }), [user, loading, createProfile, signIn, resetPassword, updateFullName, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

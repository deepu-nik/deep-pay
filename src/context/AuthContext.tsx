import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { mockAuthService } from "@/src/services/mock/authService";
import type { AuthUser, CreateProfileInput } from "@/src/types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  createProfile: (input: CreateProfileInput) => Promise<AuthUser>;
  signIn: (email: string) => Promise<AuthUser>;
  updateFullName: (fullName: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    mockAuthService.getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const createProfile = useCallback(async (input: CreateProfileInput) => {
    const nextUser = await mockAuthService.createProfile(input);
    setUser(nextUser);
    return nextUser;
  }, []);

  const signIn = useCallback(async (email: string) => {
    const nextUser = await mockAuthService.signInWithEmail(email);
    setUser(nextUser);
    return nextUser;
  }, []);

  const updateFullName = useCallback(async (fullName: string) => {
    const nextUser = await mockAuthService.updateFullName(fullName);
    setUser(nextUser);
    return nextUser;
  }, []);

  const signOut = useCallback(async () => {
    await mockAuthService.signOut();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    createProfile,
    signIn,
    updateFullName,
    signOut,
  }), [user, loading, createProfile, signIn, updateFullName, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

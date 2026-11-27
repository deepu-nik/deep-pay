import type { AuthUser, CreateProfileInput } from "@/src/types/auth";

export interface AuthService {
  getCurrentUser(): Promise<AuthUser | null>;
  createProfile(input: CreateProfileInput): Promise<AuthUser>;
  signInWithEmail(email: string): Promise<AuthUser>;
  updateFullName(fullName: string): Promise<AuthUser>;
  signOut(): Promise<void>;
}

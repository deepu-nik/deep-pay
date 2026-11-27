import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthService } from "@/src/services/api/authService";
import type { AuthUser, CreateProfileInput } from "@/src/types/auth";

const USERS_KEY = "@deeppay/demo-users";
const SESSION_KEY = "@deeppay/demo-session";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function readUsers(): Promise<AuthUser[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is AuthUser => (
      Boolean(item)
      && typeof item === "object"
      && typeof (item as AuthUser).id === "string"
      && typeof (item as AuthUser).fullName === "string"
      && typeof (item as AuthUser).email === "string"
    ));
  } catch {
    return [];
  }
}

async function writeUsers(users: AuthUser[]) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function readSession(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as AuthUser;
    if (
      typeof candidate.id !== "string"
      || typeof candidate.fullName !== "string"
      || typeof candidate.email !== "string"
    ) return null;
    return candidate;
  } catch {
    return null;
  }
}

async function saveSession(user: AuthUser) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export const mockAuthService: AuthService = {
  async getCurrentUser() {
    const session = await readSession();
    if (!session) return null;

    const users = await readUsers();
    return users.find((user) => user.id === session.id) ?? null;
  },

  async createProfile(input: CreateProfileInput) {
    const fullName = input.fullName.trim().replace(/\s+/g, " ");
    const email = normalizeEmail(input.email);

    if (fullName.length < 2) throw new Error("Enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");

    const users = await readUsers();
    if (users.some((user) => normalizeEmail(user.email) === email)) {
      throw new Error("A demo profile with this email already exists. Sign in instead.");
    }

    const now = new Date().toISOString();
    const user: AuthUser = {
      id: `demo-user-${Date.now()}`,
      fullName,
      email,
      createdAt: now,
      updatedAt: now,
    };

    await writeUsers([...users, user]);
    await saveSession(user);
    return user;
  },

  async signInWithEmail(value: string) {
    const email = normalizeEmail(value);
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");

    const users = await readUsers();
    const user = users.find((item) => normalizeEmail(item.email) === email);
    if (!user) {
      throw new Error("No local demo profile found for this email. Create a profile first.");
    }

    await saveSession(user);
    return user;
  },

  async updateFullName(value: string) {
    const fullName = value.trim().replace(/\s+/g, " ");
    if (fullName.length < 2) throw new Error("Name must contain at least 2 characters.");

    const session = await readSession();
    if (!session) throw new Error("Your demo session has expired. Sign in again.");

    const users = await readUsers();
    const index = users.findIndex((user) => user.id === session.id);
    const existingUser = users[index];
    if (!existingUser) throw new Error("We couldn't find your local demo profile.");

    const updated: AuthUser = {
      ...existingUser,
      fullName,
      updatedAt: new Date().toISOString(),
    };
    const nextUsers = [...users];
    nextUsers[index] = updated;

    await writeUsers(nextUsers);
    await saveSession(updated);
    return updated;
  },

  async signOut() {
    await AsyncStorage.removeItem(SESSION_KEY);
  },
};

import AsyncStorage from "@react-native-async-storage/async-storage";

export async function readMockList<T>(key: string, fallback: T[]): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    await AsyncStorage.setItem(key, JSON.stringify(fallback));
    return [...fallback];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [...fallback];
  } catch {
    await AsyncStorage.setItem(key, JSON.stringify(fallback));
    return [...fallback];
  }
}

export async function writeMockList<T>(key: string, value: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

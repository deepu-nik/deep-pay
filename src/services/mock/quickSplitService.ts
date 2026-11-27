import AsyncStorage from "@react-native-async-storage/async-storage";

export type QuickSplitPreset = {
  groupId: string | null;
  participantIds: string[];
  paidBy: string;
};

const STORAGE_KEY = "@deeppay/last-quick-split";

export async function getLastQuickSplit(): Promise<QuickSplitPreset | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed
      || typeof parsed !== "object"
      || !("participantIds" in parsed)
      || !Array.isArray(parsed.participantIds)
      || !parsed.participantIds.every((id) => typeof id === "string")
      || !("paidBy" in parsed)
      || typeof parsed.paidBy !== "string"
    ) {
      return null;
    }

    const groupId = "groupId" in parsed && typeof parsed.groupId === "string"
      ? parsed.groupId
      : null;

    return {
      groupId,
      participantIds: parsed.participantIds,
      paidBy: parsed.paidBy,
    };
  } catch {
    return null;
  }
}

export async function saveLastQuickSplit(preset: QuickSplitPreset): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preset));
  } catch {
    // A failed preference write should never block recording the expense.
  }
}

import { useCallback, useEffect, useState } from "react";
import {
  getLastQuickSplit,
  saveLastQuickSplit as persistLastQuickSplit,
  type QuickSplitPreset,
} from "@/src/services/mock/quickSplitService";

export function useQuickSplitPreferences() {
  const [lastPreset, setLastPreset] = useState<QuickSplitPreset | null>(null);

  useEffect(() => {
    let active = true;
    getLastQuickSplit().then((preset) => {
      if (active) setLastPreset(preset);
    });
    return () => {
      active = false;
    };
  }, []);

  const saveLastPreset = useCallback(async (preset: QuickSplitPreset) => {
    await persistLastQuickSplit(preset);
    setLastPreset(preset);
  }, []);

  return { lastPreset, saveLastPreset };
}

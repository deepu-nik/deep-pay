import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { Appearance, useColorScheme } from "react-native";
import { darkColors } from "./dark";
import { lightColors } from "./light";
import { snapColors } from "./snap";
import type { ThemeColors } from "./tokens";

export type ThemeMode = "system" | "light" | "dark" | "snap";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = "@deeppay/theme-mode";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "system" || stored === "light" || stored === "dark" || stored === "snap") {
        setModeState(stored);
      }
    }).catch(() => {});
  }, []);

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    AsyncStorage.setItem(STORAGE_KEY, nextMode).catch(() => {});
  };

  const systemMode = systemScheme ?? Appearance.getColorScheme() ?? "light";
  const resolvedMode: "light" | "dark" = mode === "system"
    ? systemMode
    : mode === "dark"
      ? "dark"
      : "light";

  const colors = mode === "snap"
    ? snapColors
    : resolvedMode === "dark"
      ? darkColors
      : lightColors;

  const value = useMemo(() => ({
    mode,
    resolvedMode,
    colors,
    setMode,
  }), [mode, resolvedMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}

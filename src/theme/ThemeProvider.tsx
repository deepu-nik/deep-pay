import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { Appearance, useColorScheme } from "react-native";
import { darkColors } from "./dark";
import { lightColors } from "./light";

export type ThemeMode = "system" | "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  colors: typeof lightColors;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = "@deeppay/theme-mode";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "system" || stored === "light" || stored === "dark") {
        setModeState(stored);
      }
    }).catch(() => {});
  }, []);

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    AsyncStorage.setItem(STORAGE_KEY, nextMode).catch(() => {});
  };

  const resolvedMode = mode === "system"
    ? (systemScheme ?? Appearance.getColorScheme() ?? "light")
    : mode;

  const value = useMemo(() => ({
    mode,
    resolvedMode: resolvedMode as "light" | "dark",
    colors: resolvedMode === "dark" ? darkColors : lightColors,
    setMode,
  }), [mode, resolvedMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}

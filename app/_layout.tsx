import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import { ThemeProvider, useTheme } from "@/src/theme";

function AppShell() {
  const { resolvedMode } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const firstSegment = segments[0];
    const isAuthRoute = firstSegment === "auth";
    const isEntryRoute = firstSegment === "index" || firstSegment === undefined;

    if (user && isAuthRoute) {
      router.replace("/(tabs)");
    } else if (!user && !isAuthRoute && !isEntryRoute) {
      router.replace("/auth/welcome");
    }
  }, [user, loading, segments, router]);

  return (
    <>
      <StatusBar style={resolvedMode === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}

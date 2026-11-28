import { useEffect } from "react";
import { Stack, useRouter, useSegments, type Href } from "expo-router";
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

    // Expo Router's generated segment union can lag new route folders until
    // its type-generation step runs. Keep the runtime segment check string-safe.
    const firstSegment = segments[0] as string | undefined;
    const isAuthRoute = firstSegment === "auth";
    const isPublicInviteRoute = firstSegment === "group-invite";
    const isEntryRoute = firstSegment === "index" || firstSegment === undefined;

    if (user && isAuthRoute) {
      router.replace("/(tabs)");
    } else if (!user && !isAuthRoute && !isPublicInviteRoute && !isEntryRoute) {
      router.replace("/auth/welcome" as Href);
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

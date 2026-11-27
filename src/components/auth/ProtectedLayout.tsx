import type { PropsWithChildren } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect, type Href } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/theme";

export function ProtectedLayout({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) return <Redirect href={"/auth/welcome" as Href} />;
  return <>{children}</>;
}

import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AppText } from "@/src/components/common/AppText";
import { useTheme } from "@/src/theme";
import { spacing } from "@/src/theme/tokens";

export function LoadingState({ message = "Loading…" }: { message?: string }) {
  const { colors } = useTheme();
  return <View style={styles.container}>
    <ActivityIndicator size="small" color={colors.primary} />
    <AppText variant="caption" style={{ color: colors.textMuted }}>{message}</AppText>
  </View>;
}

const styles = StyleSheet.create({
  container: { minHeight: 96, alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.lg },
});

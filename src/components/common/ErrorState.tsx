import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { useTheme } from "@/src/theme";
import { spacing } from "@/src/theme/tokens";

export function ErrorState({ message = "Something went wrong. Please try again." }: { message?: string }) {
  const { colors } = useTheme();
  return <View style={styles.container}>
    <View style={[styles.icon, { backgroundColor: colors.surfaceMuted }]}>
      <Ionicons name="alert-circle-outline" size={24} color={colors.danger} />
    </View>
    <AppText variant="bodyMedium">Unable to load</AppText>
    <AppText variant="caption" style={{ color: colors.textMuted, textAlign: "center" }}>{message}</AppText>
  </View>;
}
const styles = StyleSheet.create({
  container: { minHeight: 120, alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.sm },
  icon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
});

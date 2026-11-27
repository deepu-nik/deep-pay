import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

export function EmptyState({ icon = "receipt-outline", title, message }: { icon?: keyof typeof Ionicons.glyphMap; title: string; message: string }) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    container: { alignItems: "center", padding: spacing.xxl, gap: spacing.sm },
    icon: { width: 62, height: 62, borderRadius: 23, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: spacing.sm },
    message: { color: colors.textMuted, textAlign: "center", maxWidth: 280, lineHeight: 20 },
    title: { fontWeight: "800" },
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.icon}>
        <Ionicons name={icon} size={27} color="#FFFFFF" />
      </LinearGradient>
      <AppText variant="bodyMedium" style={styles.title}>{title}</AppText>
      <AppText variant="caption" style={styles.message}>{message}</AppText>
    </View>
  );
}

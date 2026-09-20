import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { colors, spacing } from "@/src/theme/tokens";

export function EmptyState({ icon = "receipt-outline", title, message }: { icon?: keyof typeof Ionicons.glyphMap; title: string; message: string }) {
  return <View style={styles.container}><View style={styles.icon}><Ionicons name={icon} size={24} color={colors.textMuted} /></View><AppText variant="bodyMedium">{title}</AppText><AppText variant="caption" style={styles.message}>{message}</AppText></View>;
}
const styles = StyleSheet.create({ container: { alignItems: "center", padding: spacing.xxl, gap: spacing.sm }, icon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm }, message: { color: colors.textMuted, textAlign: "center", maxWidth: 280 } });

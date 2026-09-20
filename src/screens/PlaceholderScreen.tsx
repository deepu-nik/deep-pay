import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { colors, spacing } from "@/src/theme/tokens";

export function PlaceholderScreen({ icon, title, description }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }) {
  return <View style={styles.container}><View style={styles.icon}><Ionicons name={icon} size={30} color={colors.primary} /></View><AppText variant="h2">{title}</AppText><AppText variant="body" style={styles.description}>{description}</AppText><AppText variant="caption" style={styles.phase}>Coming in the next build phase</AppText></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: spacing.xxl, gap: spacing.md }, icon: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#EAF1FF", alignItems: "center", justifyContent: "center", marginBottom: spacing.sm }, description: { color: colors.textMuted, textAlign: "center", maxWidth: 310 }, phase: { color: colors.primary, marginTop: spacing.sm } });

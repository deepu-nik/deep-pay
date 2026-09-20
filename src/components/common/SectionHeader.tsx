import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/src/components/common/AppText";
import { useTheme } from "@/src/theme";
import { spacing } from "@/src/theme/tokens";

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({ row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md } });
  return <View style={styles.row}><AppText variant="h2">{title}</AppText>{action ? <Pressable accessibilityRole="button" onPress={onAction}><AppText variant="caption" style={{ color: colors.primary }}>{action}</AppText></Pressable> : null}</View>;
}

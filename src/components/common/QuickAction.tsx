import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

type Props = { label: string; icon: keyof typeof Ionicons.glyphMap; onPress?: () => void };
export function QuickAction({ label, icon, onPress }: Props) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    container: { alignItems: "center", gap: spacing.sm, minWidth: 70, paddingVertical: spacing.xs },
    pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
    icon: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center" },
  });
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
    <View style={styles.icon}><Ionicons name={icon} size={21} color={colors.primary} /></View>
    <AppText variant="caption">{label}</AppText>
  </Pressable>;
}

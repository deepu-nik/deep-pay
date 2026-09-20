import { Pressable, StyleSheet, Text, type GestureResponderEvent } from "react-native";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

export function PrimaryButton({ title, onPress, disabled }: { title: string; onPress?: (event: GestureResponderEvent) => void; disabled?: boolean }) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    button: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
    text: { color: colors.white, fontSize: 16, fontWeight: "700" },
    pressed: { backgroundColor: colors.primaryPressed },
  });
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, pressed && !disabled && styles.pressed, disabled && { opacity: 0.45 }]}><Text style={styles.text}>{title}</Text></Pressable>;
}

import { Pressable, StyleSheet, Text, type GestureResponderEvent } from "react-native";
import { colors, radius, spacing } from "@/src/theme/tokens";

export function PrimaryButton({ title, onPress, disabled }: { title: string; onPress?: (event: GestureResponderEvent) => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, pressed && !disabled && styles.pressed, disabled && styles.disabled]}><Text style={styles.text}>{title}</Text></Pressable>;
}
const styles = StyleSheet.create({ button: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl }, text: { color: colors.white, fontSize: 16, fontWeight: "700" }, pressed: { backgroundColor: colors.primaryPressed }, disabled: { opacity: 0.45 } });

import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, type GestureResponderEvent } from "react-native";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

export function PrimaryButton({ title, onPress, disabled }: { title: string; onPress?: (event: GestureResponderEvent) => void; disabled?: boolean }) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    button: {
      minHeight: 56,
      borderRadius: radius.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.glassBorder,
      width: "100%",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 5,
    },
    gradient: {
      minHeight: 56,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
    },
    text: { color: colors.white, fontSize: 16, fontWeight: "800", letterSpacing: 0.1 },
    pressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
    disabled: { opacity: 0.45, shadowOpacity: 0 },
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <LinearGradient colors={colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        <Text style={styles.text}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

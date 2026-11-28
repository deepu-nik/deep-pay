import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { useTheme } from "@/src/theme";
import { spacing } from "@/src/theme/tokens";

type Props = { label: string; icon: keyof typeof Ionicons.glyphMap; onPress?: () => void };

export function QuickAction({ label, icon, onPress }: Props) {
  const { colors } = useTheme();
  const gradient = label === "Groups" || label === "UPI" || label === "My QR"
    ? colors.gradientSky
    : label === "Friends"
      ? colors.gradientSunset
      : label === "Split"
        ? colors.gradientMint
        : colors.gradientPrimary;
  const iconColor = label === "Expense" ? colors.white : colors.onAccent;

  const styles = StyleSheet.create({
    container: { width: "31%", minWidth: 0, alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
    pressed: { opacity: 0.78, transform: [{ scale: 0.96 }] },
    icon: {
      width: 58,
      height: 58,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.glassBorder,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.16,
      shadowRadius: 8,
      elevation: 3,
    },
    label: { fontWeight: "700", textAlign: "center" },
  });

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.icon}>
        <Ionicons name={icon} size={25} color={iconColor} />
      </LinearGradient>
      <AppText variant="caption" numberOfLines={2} style={styles.label}>{label}</AppText>
    </Pressable>
  );
}

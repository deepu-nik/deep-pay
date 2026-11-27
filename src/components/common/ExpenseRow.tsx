import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { useTheme } from "@/src/theme";
import { spacing } from "@/src/theme/tokens";
import type { Expense, ExpenseCategory } from "@/src/types/domain";

const categoryIcons: Record<ExpenseCategory, keyof typeof Ionicons.glyphMap> = {
  Food: "restaurant",
  Transport: "car-sport",
  Rent: "home",
  Education: "school",
  Entertainment: "game-controller",
  Shopping: "bag-handle",
  Technology: "laptop",
  Travel: "airplane",
  Health: "heart",
  Other: "receipt",
};

export function ExpenseRow({ expense }: { expense: Expense }) {
  const { colors } = useTheme();
  const icon = categoryIcons[expense.category] ?? "receipt";
  const usesAccentGradient = expense.category !== "Other"
    && expense.category !== "Rent"
    && expense.category !== "Education"
    && expense.category !== "Shopping";
  const gradient = expense.category === "Food" || expense.category === "Entertainment"
    ? colors.gradientSunset
    : expense.category === "Transport" || expense.category === "Travel" || expense.category === "Technology"
      ? colors.gradientSky
      : expense.category === "Health"
        ? colors.gradientMint
        : colors.gradientPrimary;

  const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md, gap: spacing.md },
    icon: { width: 46, height: 46, borderRadius: 17, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    info: { flex: 1, gap: 3 },
    amount: { fontWeight: "800" },
  });

  return (
    <View style={styles.row}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.icon}>
        <Ionicons name={icon} size={20} color={usesAccentGradient ? colors.onAccent : colors.white} />
      </LinearGradient>
      <View style={styles.info}>
        <AppText variant="bodyMedium" numberOfLines={1}>{expense.description}</AppText>
        <AppText variant="caption" style={{ color: colors.textMuted }}>{expense.category} · {expense.date}</AppText>
      </View>
      <AppText variant="bodyMedium" style={styles.amount}>₹{expense.amount.toLocaleString("en-IN")}</AppText>
    </View>
  );
}

import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { useTheme } from "@/src/theme";
import { spacing } from "@/src/theme/tokens";
import type { Expense } from "@/src/types/domain";

export function ExpenseRow({ expense }: { expense: Expense }) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md, gap: spacing.md },
    icon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.expenseIconBackground, alignItems: "center", justifyContent: "center" },
    info: { flex: 1, gap: 2 },
  });
  return <View style={styles.row}>
    <View style={styles.icon}><Ionicons name="receipt-outline" size={20} color={colors.primary} /></View>
    <View style={styles.info}><AppText variant="bodyMedium">{expense.description}</AppText><AppText variant="caption" style={{ color: colors.textMuted }}>{expense.category} · {expense.date}</AppText></View>
    <AppText variant="bodyMedium">₹{expense.amount.toLocaleString("en-IN")}</AppText>
  </View>;
}

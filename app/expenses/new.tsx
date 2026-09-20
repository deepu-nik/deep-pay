import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { ErrorState } from "@/src/components/common/ErrorState";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";
import type { ExpenseCategory, ExpenseSplitMethod } from "@/src/types/domain";
import { useExpenses } from "@/src/hooks/useExpenses";

const categories: ExpenseCategory[] = ["Food", "Transport", "Rent", "Education", "Entertainment", "Shopping", "Technology", "Travel", "Health", "Other"];

export default function NewExpenseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { createExpense, saving, error } = useExpenses();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const [splitMethod, setSplitMethod] = useState<ExpenseSplitMethod>("equal");
  const [validation, setValidation] = useState<string | null>(null);
  const numericAmount = useMemo(() => Number(amount.replace(/,/g, "")), [amount]);
  const canSave = numericAmount > 0 && description.trim().length > 0 && !saving;

  const submit = async () => {
    if (!numericAmount || numericAmount <= 0) return setValidation("Enter an amount greater than ₹0.");
    if (!description.trim()) return setValidation("Add a short description for this expense.");
    setValidation(null);
    const expense = await createExpense({
      amount: Math.round(numericAmount * 100) / 100,
      description: description.trim(), category, date: "Today", paidBy: "You",
      participants: ["You"], splitMethod,
      splits: [{ userId: "You", amount: Math.round(numericAmount * 100) / 100 }],
    });
    if (expense) router.replace("/(tabs)");
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    back: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
    section: { gap: spacing.sm },
    amountInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, fontSize: 32, lineHeight: 38, fontWeight: "700", color: colors.text },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, minHeight: 52, fontSize: 16, color: colors.text },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    chipSelected: { backgroundColor: colors.iconBackground, borderColor: colors.primary },
    footer: { marginTop: spacing.sm },
  });

  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={21} color={colors.text} /></Pressable>
          <View><AppText variant="h2">Add expense</AppText><AppText variant="caption" style={{ color: colors.textMuted }}>Track what you spent</AppText></View>
        </View>
        <View style={styles.section}><AppText variant="bodyMedium">Amount</AppText><TextInput value={amount} onChangeText={setAmount} placeholder="₹0" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" inputMode="decimal" style={styles.amountInput} accessibilityLabel="Expense amount" /></View>
        <View style={styles.section}><AppText variant="bodyMedium">Description</AppText><TextInput value={description} onChangeText={setDescription} placeholder="e.g. Dinner with friends" placeholderTextColor={colors.textMuted} style={styles.input} maxLength={80} accessibilityLabel="Expense description" returnKeyType="done" /></View>
        <View style={styles.section}><AppText variant="bodyMedium">Category</AppText><View style={styles.chips}>{categories.map(item => <Pressable key={item} onPress={() => setCategory(item)} accessibilityRole="radio" accessibilityState={{ selected: category === item }} style={[styles.chip, category === item && styles.chipSelected]}><AppText variant="caption" style={category === item ? { color: colors.primary } : undefined}>{item}</AppText></Pressable>)}</View></View>
        <View style={styles.section}><AppText variant="bodyMedium">Split method</AppText><View style={styles.chips}>{(["equal", "custom", "percentage"] as ExpenseSplitMethod[]).map(item => <Pressable key={item} onPress={() => setSplitMethod(item)} accessibilityRole="radio" accessibilityState={{ selected: splitMethod === item }} style={[styles.chip, splitMethod === item && styles.chipSelected]}><AppText variant="caption" style={splitMethod === item ? { color: colors.primary } : undefined}>{item === "equal" ? "Equal" : item === "custom" ? "Custom" : "Percentage"}</AppText></Pressable>)}</View><AppText variant="caption" style={{ color: colors.textMuted }}>Detailed friend selection comes in the next expense step.</AppText></View>
        {validation ? <AppText variant="caption" style={{ color: colors.danger }}>{validation}</AppText> : null}
        {error ? <ErrorState message={error} /> : null}
        <View style={styles.footer}><PrimaryButton title={saving ? "Saving…" : "Save expense"} onPress={submit} disabled={!canSave} /></View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

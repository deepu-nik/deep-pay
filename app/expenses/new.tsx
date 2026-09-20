import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { ErrorState } from "@/src/components/common/ErrorState";
import { LoadingState } from "@/src/components/common/LoadingState";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";
import type { ExpenseCategory, ExpenseSplitMethod } from "@/src/types/domain";
import { useExpenses } from "@/src/hooks/useExpenses";
import { useFriends } from "@/src/hooks/useFriends";
import { useGroups } from "@/src/hooks/useGroups";

const categories: ExpenseCategory[] = ["Food", "Transport", "Rent", "Education", "Entertainment", "Shopping", "Technology", "Travel", "Health", "Other"];
const CURRENT_USER = { id: "You", name: "You" };

function toAmount(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function equalSplits(total: number, participantIds: string[]) {
  const totalPaise = Math.round(total * 100);
  const basePaise = Math.floor(totalPaise / participantIds.length);
  const remainder = totalPaise % participantIds.length;

  return Object.fromEntries(
    participantIds.map((id, index) => [id, (basePaise + (index < remainder ? 1 : 0)) / 100]),
  ) as Record<string, number>;
}

export default function NewExpenseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { createExpense, saving, error } = useExpenses();
  const { friends, loading: friendsLoading } = useFriends();
  const { groups, loading: groupsLoading } = useGroups();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const [splitMethod, setSplitMethod] = useState<ExpenseSplitMethod>("equal");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState<string | null>(null);

  const numericAmount = useMemo(() => toAmount(amount), [amount]);
  const participantIds = useMemo(() => [CURRENT_USER.id, ...selectedFriends], [selectedFriends]);
  const participantNames = useMemo(() => Object.fromEntries([
    [CURRENT_USER.id, CURRENT_USER.name],
    ...friends.map((friend) => [friend.id, friend.name]),
  ]), [friends]);

  useEffect(() => {
    if (splitMethod === "equal") return;

    const equal = equalSplits(numericAmount, participantIds);
    if (splitMethod === "custom") {
      setCustomAmounts((current) => Object.fromEntries(
        participantIds.map((id) => [id, current[id] ?? String(equal[id] ?? 0)]),
      ));
    } else {
      const equalPercentage = participantIds.length ? 100 / participantIds.length : 0;
      setPercentages((current) => Object.fromEntries(
        participantIds.map((id) => [id, current[id] ?? equalPercentage.toFixed(2)]),
      ));
    }
  }, [numericAmount, participantIds, splitMethod]);

  const calculatedSplits = useMemo(() => {
    if (!numericAmount || participantIds.length === 0) return {};

    if (splitMethod === "equal") return equalSplits(numericAmount, participantIds);

    if (splitMethod === "custom") {
      return Object.fromEntries(
        participantIds.map((id) => [id, toAmount(customAmounts[id] ?? "")]),
      ) as Record<string, number>;
    }

    const percentageValues: Record<string, number> = Object.fromEntries(
      participantIds.map((id) => [id, toAmount(percentages[id] ?? "")]),
    );

    return Object.fromEntries(
      participantIds.map((id) => [id, Math.round(numericAmount * (percentageValues[id] ?? 0) * 100) / 10000]),
    ) as Record<string, number>;
  }, [numericAmount, participantIds, splitMethod, customAmounts, percentages]);

  const splitTotal = Object.values(calculatedSplits).reduce((sum, value) => sum + value, 0);
  const percentageTotal = Object.values(percentages).reduce((sum, value) => sum + toAmount(value), 0);
  const splitIsValid = splitMethod === "percentage"
    ? Math.abs(percentageTotal - 100) < 0.01 && Math.abs(splitTotal - numericAmount) < 0.01
    : Math.abs(splitTotal - numericAmount) < 0.01;

  const canSave = numericAmount > 0 && description.trim().length > 0 && splitIsValid && !saving;

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((current) => current.includes(friendId)
      ? current.filter((id) => id !== friendId)
      : [...current, friendId]);
    setValidation(null);
  };

  const submit = async () => {
    if (!numericAmount || numericAmount <= 0) {
      setValidation("Enter an amount greater than ₹0.");
      return;
    }
    if (!description.trim()) {
      setValidation("Add a short description for this expense.");
      return;
    }
    if (!splitIsValid) {
      setValidation(splitMethod === "percentage"
        ? `Percentages must add up to 100%. Current total: ${percentageTotal.toFixed(2)}%.`
        : `Split amounts must add up to ${formatMoney(numericAmount)}. Current total: ${formatMoney(splitTotal)}.`);
      return;
    }

    setValidation(null);

    const splits = participantIds.map((userId) => ({
      userId,
      amount: Math.round((calculatedSplits[userId] ?? 0) * 100) / 100,
      ...(splitMethod === "percentage" ? { percentage: toAmount(percentages[userId] ?? "") } : {}),
    }));

    const expense = await createExpense({
      amount: Math.round(numericAmount * 100) / 100,
      description: description.trim(),
      category,
      date: "Today",
      paidBy: CURRENT_USER.id,
      participants: participantIds,
      splitMethod,
      splits,
      ...(selectedGroupId ? { groupId: selectedGroupId } : {}),
    });

    if (expense) router.replace(selectedGroupId ? `/groups/${selectedGroupId}` : "/(tabs)");
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    back: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
    section: { gap: spacing.sm },
    amountInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, fontSize: 32, lineHeight: 38, fontWeight: "700", color: colors.text },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, minHeight: 52, fontSize: 16, color: colors.text },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    chipSelected: { backgroundColor: colors.iconBackground, borderColor: colors.primary },
    participantCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
    participantRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
    shareInput: { width: 100, minHeight: 44, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, color: colors.text, textAlign: "right" },
    summary: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
    footer: { marginTop: spacing.sm },
  });

  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </Pressable>
          <View><AppText variant="h2">Add expense</AppText><AppText variant="caption" style={{ color: colors.textMuted }}>Track what you spent</AppText></View>
        </View>

        <View style={styles.section}>
          <AppText variant="bodyMedium">Amount</AppText>
          <TextInput value={amount} onChangeText={setAmount} placeholder="₹0" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" inputMode="decimal" style={styles.amountInput} accessibilityLabel="Expense amount" />
        </View>

        <View style={styles.section}>
          <AppText variant="bodyMedium">Description</AppText>
          <TextInput value={description} onChangeText={setDescription} placeholder="e.g. Dinner with friends" placeholderTextColor={colors.textMuted} style={styles.input} maxLength={80} accessibilityLabel="Expense description" returnKeyType="done" />
        </View>

        <View style={styles.section}>
          <AppText variant="bodyMedium">Group (optional)</AppText>
          {groupsLoading ? <LoadingState message="Loading groups…" /> : groups.length === 0 ? (
            <AppText variant="caption" style={{ color: colors.textMuted }}>Create a group first to link this expense to a group.</AppText>
          ) : (
            <View style={styles.chips}>
              <Pressable onPress={() => setSelectedGroupId(null)} accessibilityRole="radio" accessibilityState={{ selected: selectedGroupId === null }} style={[styles.chip, selectedGroupId === null && styles.chipSelected]}>
                <AppText variant="caption" style={selectedGroupId === null ? { color: colors.primary } : undefined}>No group</AppText>
              </Pressable>
              {groups.map((group) => {
                const selected = selectedGroupId === group.id;
                return <Pressable key={group.id} onPress={() => setSelectedGroupId(group.id)} accessibilityRole="radio" accessibilityState={{ selected }} style={[styles.chip, selected && styles.chipSelected]}>
                  <AppText variant="caption" style={selected ? { color: colors.primary } : undefined}>{group.name}</AppText>
                </Pressable>;
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <AppText variant="bodyMedium">Who was involved?</AppText>
          <View style={styles.chips}>
            <View style={[styles.chip, styles.chipSelected]}><AppText variant="caption" style={{ color: colors.primary }}>You</AppText></View>
            {friendsLoading ? null : friends.map((friend) => {
              const selected = selectedFriends.includes(friend.id);
              return <Pressable key={friend.id} onPress={() => toggleFriend(friend.id)} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} style={[styles.chip, selected && styles.chipSelected]}>
                <AppText variant="caption" style={selected ? { color: colors.primary } : undefined}>{friend.name}</AppText>
              </Pressable>;
            })}
          </View>
          {friendsLoading ? <LoadingState message="Loading friends…" /> : null}
        </View>

        <View style={styles.section}>
          <AppText variant="bodyMedium">Split method</AppText>
          <View style={styles.chips}>
            {(["equal", "custom", "percentage"] as ExpenseSplitMethod[]).map((item) => (
              <Pressable key={item} onPress={() => { setSplitMethod(item); setValidation(null); }} accessibilityRole="radio" accessibilityState={{ selected: splitMethod === item }} style={[styles.chip, splitMethod === item && styles.chipSelected]}>
                <AppText variant="caption" style={splitMethod === item ? { color: colors.primary } : undefined}>{item === "equal" ? "Equal" : item === "custom" ? "Custom" : "Percentage"}</AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {participantIds.length > 0 ? <View style={styles.participantCard}>
          <AppText variant="bodyMedium">Split details</AppText>
          {participantIds.map((id) => (
            <View key={id} style={styles.participantRow}>
              <AppText variant="body">{participantNames[id] ?? id}</AppText>
              {splitMethod === "equal" ? <AppText variant="bodyMedium">{formatMoney(calculatedSplits[id] ?? 0)}</AppText> : (
                <TextInput value={splitMethod === "custom" ? (customAmounts[id] ?? "") : (percentages[id] ?? "")} onChangeText={(value) => {
                  if (splitMethod === "custom") setCustomAmounts((current) => ({ ...current, [id]: value }));
                  else setPercentages((current) => ({ ...current, [id]: value }));
                  setValidation(null);
                }} keyboardType="decimal-pad" inputMode="decimal" style={styles.shareInput} placeholder={splitMethod === "custom" ? "₹0" : "0%"} placeholderTextColor={colors.textMuted} accessibilityLabel={`${participantNames[id] ?? id} ${splitMethod} share`} />
              )}
            </View>
          ))}
          <View style={styles.summary}>
            <AppText variant="caption" style={{ color: colors.textMuted }}>
              {splitMethod === "percentage" ? `Percentage total: ${percentageTotal.toFixed(2)}%` : `Split total: ${formatMoney(splitTotal)}`}
            </AppText>
            {splitMethod !== "equal" && !splitIsValid ? <AppText variant="caption" style={{ color: colors.danger }}>
              {splitMethod === "percentage" ? "Percentages must total 100%." : `Amounts must total ${formatMoney(numericAmount)}.`}
            </AppText> : null}
          </View>
        </View> : null}

        <View style={styles.section}>
          <AppText variant="bodyMedium">Category</AppText>
          <View style={styles.chips}>{categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} accessibilityRole="radio" accessibilityState={{ selected: category === item }} style={[styles.chip, category === item && styles.chipSelected]}><AppText variant="caption" style={category === item ? { color: colors.primary } : undefined}>{item}</AppText></Pressable>)}</View>
        </View>

        {validation ? <AppText variant="caption" style={{ color: colors.danger }}>{validation}</AppText> : null}
        {error ? <ErrorState message={error} /> : null}
        <View style={styles.footer}><PrimaryButton title={saving ? "Saving…" : "Save expense"} onPress={submit} disabled={!canSave} /></View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { GlassPanel } from "@/src/components/common/GlassPanel";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { ErrorState } from "@/src/components/common/ErrorState";
import { LoadingState } from "@/src/components/common/LoadingState";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";
import type { ExpenseCategory, ExpenseSplitMethod, GroupMember, PaymentMethod } from "@/src/types/domain";
import { useExpenses } from "@/src/hooks/useExpenses";
import { useGroups } from "@/src/hooks/useGroups";
import { useAuth } from "@/src/context/AuthContext";
import { useQuickSplitPreferences } from "@/src/hooks/useQuickSplitPreferences";

const categories: ExpenseCategory[] = ["Food", "Transport", "Rent", "Education", "Entertainment", "Shopping", "Technology", "Travel", "Health", "Other"];
const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank" },
];

function toAmount(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return "₹" + value.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function equalSplits(total: number, participantIds: string[]) {
  if (!participantIds.length) return {};
  const totalPaise = Math.round(total * 100);
  const basePaise = Math.floor(totalPaise / participantIds.length);
  const remainder = totalPaise % participantIds.length;
  return Object.fromEntries(
    participantIds.map((id, index) => [id, (basePaise + (index < remainder ? 1 : 0)) / 100]),
  ) as Record<string, number>;
}

export default function NewExpenseScreen() {
  const router = useRouter();
  const { groupId, intent } = useLocalSearchParams<{ groupId?: string; intent?: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { createExpense, saving, error } = useExpenses();
  const { groups, loading: groupsLoading, listMembers } = useGroups();
  const { lastPreset, saveLastPreset } = useQuickSplitPreferences();
  const currentUid = user?.id ?? "";
  const isSplitIntent = intent === "split";

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [splitMethod, setSplitMethod] = useState<ExpenseSplitMethod>("equal");
  const [paidBy, setPaidBy] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groupId ?? null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPayerPicker, setShowPayerPicker] = useState(false);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const participantIds = useMemo(
    () => selectedGroup
      ? selectedGroup.memberIds.filter((memberId) => selectedMemberIds.includes(memberId))
      : currentUid ? [currentUid] : [],
    [selectedGroup, selectedMemberIds, currentUid],
  );
  const participantNames = useMemo(() => Object.fromEntries(
    participantIds.map((id, index) => [
      id,
      id === currentUid ? "You" : groupMembers.find((member) => member.uid === id)?.displayName ?? "Member " + (index + 1),
    ]),
  ), [participantIds, currentUid, groupMembers]);

  useEffect(() => {
    let active = true;
    if (!selectedGroupId || !currentUid) {
      setGroupMembers([]);
      setSelectedMemberIds(currentUid ? [currentUid] : []);
      setMembersLoading(false);
      return () => { active = false; };
    }

    setGroupMembers([]);
    setSelectedMemberIds([]);
    setMembersLoading(true);
    listMembers(selectedGroupId)
      .then((members) => {
        if (!active) return;
        setGroupMembers(members);
        setSelectedMemberIds(members.map((member) => member.uid));
      })
      .catch((cause: unknown) => {
        if (active) setValidation(cause instanceof Error ? cause.message : "We couldn't load this group's members.");
      })
      .finally(() => {
        if (active) setMembersLoading(false);
      });

    return () => { active = false; };
  }, [selectedGroupId, currentUid, listMembers]);

  useEffect(() => {
    if (currentUid && !participantIds.includes(paidBy)) setPaidBy(currentUid);
  }, [currentUid, participantIds, paidBy]);

  useEffect(() => {
    if (splitMethod === "equal" || participantIds.length === 0) return;
    const equal = equalSplits(toAmount(amount), participantIds);
    if (splitMethod === "custom") {
      setCustomAmounts((current) => Object.fromEntries(
        participantIds.map((id) => [id, current[id] ?? String(equal[id] ?? 0)]),
      ));
    } else {
      const equalPercentage = 100 / participantIds.length;
      setPercentages((current) => Object.fromEntries(
        participantIds.map((id) => [id, current[id] ?? equalPercentage.toFixed(2)]),
      ));
    }
  }, [amount, participantIds, splitMethod]);

  const numericAmount = useMemo(() => toAmount(amount), [amount]);
  const calculatedSplits = useMemo(() => {
    if (!numericAmount || participantIds.length === 0) return {};
    if (splitMethod === "equal") return equalSplits(numericAmount, participantIds);
    if (splitMethod === "custom") {
      return Object.fromEntries(participantIds.map((id) => [id, toAmount(customAmounts[id] ?? "")])) as Record<string, number>;
    }
    const values = Object.fromEntries(participantIds.map((id) => [id, toAmount(percentages[id] ?? "")])) as Record<string, number>;
    return Object.fromEntries(participantIds.map((id) => [
      id,
      Math.round(numericAmount * (values[id] ?? 0) * 100) / 10000,
    ])) as Record<string, number>;
  }, [numericAmount, participantIds, splitMethod, customAmounts, percentages]);

  const splitTotal = Object.values(calculatedSplits).reduce((sum, value) => sum + value, 0);
  const percentageTotal = participantIds.reduce((sum, id) => sum + toAmount(percentages[id] ?? ""), 0);
  const splitIsValid = splitMethod === "percentage"
    ? Math.abs(percentageTotal - 100) < 0.01 && Math.abs(splitTotal - numericAmount) < 0.01
    : Math.abs(splitTotal - numericAmount) < 0.01;
  const canSave = Boolean(currentUid)
    && numericAmount > 0
    && description.trim().length >= 2
    && splitIsValid
    && participantIds.length > 0
    && (!selectedGroup || participantIds.includes(currentUid))
    && !membersLoading
    && !saving
    && (!selectedGroupId || Boolean(selectedGroup))
    && (!isSplitIntent || (Boolean(selectedGroup) && participantIds.length >= 2));

  const selectGroup = (nextGroupId: string | null) => {
    setSelectedGroupId(nextGroupId);
    setPaidBy(currentUid);
    setSelectedMemberIds(nextGroupId ? [] : currentUid ? [currentUid] : []);
    setValidation(null);
  };

  const toggleParticipant = (memberId: string) => {
    if (memberId === currentUid) return;
    setSelectedMemberIds((current) => {
      const next = current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId];
      if (!next.includes(paidBy)) setPaidBy(currentUid);
      return next;
    });
    setValidation(null);
  };

  const applyLastPreset = () => {
    if (!lastPreset) return;
    const savedGroup = groups.find((group) => group.id === lastPreset.groupId);
    if (!savedGroup) {
      setValidation("The group from your previous split is no longer available.");
      return;
    }
    setSelectedGroupId(savedGroup.id);
    setPaidBy(savedGroup.memberIds.includes(lastPreset.paidBy) ? lastPreset.paidBy : currentUid);
    setValidation(null);
  };

  const submit = async () => {
    if (!numericAmount || numericAmount <= 0) {
      setValidation("Enter an amount greater than ₹0.");
      return;
    }
    if (description.trim().length < 2) {
      setValidation("Add a description with at least 2 characters.");
      return;
    }
    if (isSplitIntent && !selectedGroup) {
      setValidation("Choose a group first. Invite friends using its group invite link to split expenses together.");
      return;
    }
    if (isSplitIntent && participantIds.length < 2) {
      setValidation("Select at least one other group member to split this expense.");
      return;
    }
    if (!splitIsValid) {
      setValidation(splitMethod === "percentage"
        ? "Percentages must add up to 100%. Current total: " + percentageTotal.toFixed(2) + "%."
        : "Split amounts must add up to " + formatMoney(numericAmount) + ". Current total: " + formatMoney(splitTotal) + ".");
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
      paidBy,
      participants: participantIds,
      splitMethod,
      splits,
      paymentMethod,
      ...(selectedGroupId ? { groupId: selectedGroupId } : {}),
    });

    if (expense) {
      if (isSplitIntent && selectedGroupId) {
        await saveLastPreset({ groupId: selectedGroupId, participantIds, paidBy });
      }
      router.replace(selectedGroupId ? ("/groups/" + selectedGroupId) as any : "/(tabs)");
    }
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    back: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.glassGradient[0], borderWidth: 1, borderColor: colors.glassBorder, alignItems: "center", justifyContent: "center" },
    section: { gap: spacing.sm },
    amountInput: { backgroundColor: colors.glassGradient[0], borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radius.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, fontSize: 32, lineHeight: 38, fontWeight: "700", color: colors.text },
    input: { backgroundColor: colors.glassGradient[0], borderWidth: 1, borderColor: colors.glassBorder, paddingHorizontal: spacing.lg, minHeight: 52, fontSize: 16, color: colors.text, borderRadius: radius.md },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.glassGradient[0], borderWidth: 1, borderColor: colors.glassBorder },
    chipSelected: { backgroundColor: colors.iconBackground, borderColor: colors.primary },
    participantCard: { borderRadius: radius.md, gap: spacing.sm },
    participantRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
    shareInput: { width: 100, minHeight: 44, backgroundColor: colors.glassGradient[0], borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radius.sm, paddingHorizontal: spacing.md, color: colors.text, textAlign: "right" },
    summary: { borderRadius: radius.md, gap: spacing.xs },
    footer: { marginTop: spacing.sm },
    repeatCard: { width: "100%", flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
    repeatCardPanel: { borderRadius: radius.lg },
    repeatIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center" },
    repeatCopy: { flex: 1, gap: 2 },
    quickPayer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 54, backgroundColor: colors.glassGradient[0], paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.glassBorder },
    advancedToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm },
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}>
              <Ionicons name="arrow-back" size={21} color={colors.text} />
            </Pressable>
            <View>
              <AppText variant="h2">{isSplitIntent ? "Quick split" : "Add expense"}</AppText>
              <AppText variant="caption" style={{ color: colors.textMuted }}>{isSplitIntent ? "Split a group expense" : "Track what you spent"}</AppText>
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="bodyMedium">Amount</AppText>
            <TextInput value={amount} onChangeText={setAmount} placeholder="₹0" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" inputMode="decimal" style={styles.amountInput} accessibilityLabel="Expense amount" />
          </View>

          <View style={styles.section}>
            <AppText variant="bodyMedium">Description</AppText>
            <TextInput value={description} onChangeText={setDescription} placeholder="e.g. Dinner, groceries or rent" placeholderTextColor={colors.textMuted} style={styles.input} maxLength={80} accessibilityLabel="Expense description" returnKeyType="done" />
          </View>

          {isSplitIntent && lastPreset && !groupsLoading ? (
            <GlassPanel padding={0} style={styles.repeatCardPanel}>
              <Pressable accessibilityRole="button" onPress={applyLastPreset} style={styles.repeatCard}>
                <View style={styles.repeatIcon}><Ionicons name="repeat" size={21} color={colors.primary} /></View>
                <View style={styles.repeatCopy}>
                  <AppText variant="bodyMedium">Repeat last split</AppText>
                  <AppText variant="caption" style={{ color: colors.textMuted }}>Reuse your previous group and payer</AppText>
                </View>
                <Ionicons name="chevron-forward" size={19} color={colors.textMuted} />
              </Pressable>
            </GlassPanel>
          ) : null}

          <View style={styles.section}>
            <AppText variant="bodyMedium">{isSplitIntent ? "Choose a group" : "Group (optional)"}</AppText>
            {groupsLoading ? <LoadingState message="Loading groups…" /> : groups.length === 0 ? (
              <AppText variant="caption" style={{ color: colors.textMuted }}>Create a group and invite people before splitting an expense.</AppText>
            ) : (
              <View style={styles.chips}>
                {!isSplitIntent ? (
                  <Pressable onPress={() => selectGroup(null)} accessibilityRole="radio" accessibilityState={{ selected: selectedGroupId === null }} style={[styles.chip, selectedGroupId === null && styles.chipSelected]}>
                    <AppText variant="caption" style={selectedGroupId === null ? { color: colors.primary } : undefined}>Personal</AppText>
                  </Pressable>
                ) : null}
                {groups.map((group) => {
                  const selected = selectedGroupId === group.id;
                  return (
                    <Pressable key={group.id} onPress={() => selectGroup(group.id)} accessibilityRole="radio" accessibilityState={{ selected }} style={[styles.chip, selected && styles.chipSelected]}>
                      <AppText variant="caption" style={selected ? { color: colors.primary } : undefined}>{group.name}</AppText>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <AppText variant="bodyMedium">Participants</AppText>
            {selectedGroup ? (
              <>
                <AppText variant="caption" style={{ color: colors.textMuted }}>
                  Choose only the members sharing this expense. You're included as the creator.
                </AppText>
                {membersLoading ? <LoadingState message="Loading group members…" /> : (
                  <View style={styles.chips}>
                    {groupMembers.map((member) => {
                      const selected = participantIds.includes(member.uid);
                      const isCurrentUser = member.uid === currentUid;
                      return (
                        <Pressable
                          key={member.uid}
                          onPress={() => toggleParticipant(member.uid)}
                          disabled={isCurrentUser}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected, disabled: isCurrentUser }}
                          style={[styles.chip, selected && styles.chipSelected, isCurrentUser && { opacity: 0.8 }]}
                        >
                          <AppText variant="caption" style={selected ? { color: colors.primary } : undefined}>
                            {isCurrentUser ? "You" : member.displayName}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
                {!membersLoading && participantIds.length === 1 ? (
                  <AppText variant="caption" style={{ color: colors.textMuted }}>Only your share is selected. Add another member to split this expense.</AppText>
                ) : null}
              </>
            ) : (
              <AppText variant="caption" style={{ color: colors.textMuted }}>This is a personal expense. Choose a group above to share it with other members.</AppText>
            )}
          </View>

          <View style={styles.section}>
            <AppText variant="bodyMedium">Payment method</AppText>
            <View style={styles.chips}>
              {paymentMethods.map((method) => (
                <Pressable key={method.value} onPress={() => setPaymentMethod(method.value)} accessibilityRole="radio" accessibilityState={{ selected: paymentMethod === method.value }} style={[styles.chip, paymentMethod === method.value && styles.chipSelected]}>
                  <AppText variant="caption" style={paymentMethod === method.value ? { color: colors.primary } : undefined}>{method.label}</AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="bodyMedium">Paid by</AppText>
            {participantIds.length > 1 ? (
              <>
                <Pressable accessibilityRole="button" onPress={() => setShowPayerPicker((current) => !current)} style={styles.quickPayer}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <Ionicons name="wallet-outline" size={20} color={colors.primary} />
                    <AppText variant="bodyMedium">{participantNames[paidBy] ?? "Choose member"}</AppText>
                  </View>
                  <AppText variant="caption" style={{ color: colors.primary }}>{showPayerPicker ? "Done" : "Change"}</AppText>
                </Pressable>
                {showPayerPicker ? (
                  <View style={styles.chips}>
                    {participantIds.map((id) => {
                      const selected = paidBy === id;
                      return (
                        <Pressable key={id} onPress={() => { setPaidBy(id); setShowPayerPicker(false); }} accessibilityRole="radio" accessibilityState={{ selected }} style={[styles.chip, selected && styles.chipSelected]}>
                          <AppText variant="caption" style={selected ? { color: colors.primary } : undefined}>{participantNames[id] ?? "Member"}</AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </>
            ) : (
              <AppText variant="caption" style={{ color: colors.textMuted }}>You paid this expense.</AppText>
            )}
          </View>

          {isSplitIntent ? (
            <Pressable accessibilityRole="button" onPress={() => setShowAdvanced((current) => { if (current) setSplitMethod("equal"); return !current; })} style={styles.advancedToggle}>
              <AppText variant="caption" style={{ color: colors.primary, fontWeight: "800" }}>{showAdvanced ? "Hide split options" : "Customize split (optional)"}</AppText>
              <Ionicons name={showAdvanced ? "chevron-up" : "options-outline"} size={18} color={colors.primary} />
            </Pressable>
          ) : null}

          {(!isSplitIntent || showAdvanced) ? (
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
          ) : null}

          {participantIds.length > 0 ? (
            <GlassPanel padding={spacing.md} style={styles.participantCard}>
              <AppText variant="bodyMedium">{splitMethod === "equal" ? "Split details" : "Custom shares"}</AppText>
              {participantIds.map((id) => (
                <View key={id} style={styles.participantRow}>
                  <AppText variant="body">{participantNames[id] ?? "Member"}</AppText>
                  {splitMethod === "equal" ? (
                    <AppText variant="bodyMedium">{formatMoney(calculatedSplits[id] ?? 0)}</AppText>
                  ) : (
                    <TextInput
                      value={splitMethod === "custom" ? (customAmounts[id] ?? "") : (percentages[id] ?? "")}
                      onChangeText={(value) => {
                        if (splitMethod === "custom") setCustomAmounts((current) => ({ ...current, [id]: value }));
                        else setPercentages((current) => ({ ...current, [id]: value }));
                        setValidation(null);
                      }}
                      keyboardType="decimal-pad"
                      inputMode="decimal"
                      style={styles.shareInput}
                      placeholder={splitMethod === "custom" ? "₹0" : "0%"}
                      placeholderTextColor={colors.textMuted}
                    />
                  )}
                </View>
              ))}
              <GlassPanel padding={spacing.md} style={styles.summary}>
                <AppText variant="caption" style={{ color: colors.textMuted }}>
                  {splitMethod === "percentage" ? "Percentage total: " + percentageTotal.toFixed(2) + "%" : "Split total: " + formatMoney(splitTotal)}
                </AppText>
                {splitMethod !== "equal" && !splitIsValid ? (
                  <AppText variant="caption" style={{ color: colors.danger }}>
                    {splitMethod === "percentage" ? "Percentages must total 100%." : "Amounts must total " + formatMoney(numericAmount) + "."}
                  </AppText>
                ) : null}
              </GlassPanel>
            </GlassPanel>
          ) : null}

          {!isSplitIntent || showAdvanced ? (
            <View style={styles.section}>
              <AppText variant="bodyMedium">Category</AppText>
              <View style={styles.chips}>
                {categories.map((item) => (
                  <Pressable key={item} onPress={() => setCategory(item)} accessibilityRole="radio" accessibilityState={{ selected: category === item }} style={[styles.chip, category === item && styles.chipSelected]}>
                    <AppText variant="caption" style={category === item ? { color: colors.primary } : undefined}>{item}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {validation ? <AppText variant="caption" style={{ color: colors.danger }}>{validation}</AppText> : null}
          {error ? <ErrorState message={error} /> : null}
          <View style={styles.footer}>
            <PrimaryButton title={saving ? (isSplitIntent ? "Splitting…" : "Saving…") : (isSplitIntent ? "Split bill" : "Save expense")} onPress={submit} disabled={!canSave} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

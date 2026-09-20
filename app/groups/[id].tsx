import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { LoadingState } from "@/src/components/common/LoadingState";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { useGroups } from "@/src/hooks/useGroups";
import { useFriends } from "@/src/hooks/useFriends";
import { useExpenses } from "@/src/hooks/useExpenses";
import { useSettlements } from "@/src/hooks/useSettlements";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";
import type { Expense, GroupBalance, Settlement } from "@/src/types/domain";

const CURRENT_USER = { id: "You", name: "You" };

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { groups, loading, updateGroup, deleteGroup } = useGroups();
  const { friends, refresh: refreshFriends } = useFriends();
  const { listByGroup, getGroupBalances } = useExpenses();
  const { listByGroup: listSettlementsByGroup, createSettlement, saving: settlementSaving } = useSettlements();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [balances, setBalances] = useState<GroupBalance[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [settlementsLoading, setSettlementsLoading] = useState(true);
  const [settlementVisible, setSettlementVisible] = useState(false);
  const [settlementTarget, setSettlementTarget] = useState("");
  const [settlementAmount, setSettlementAmount] = useState("");
  const [editorVisible, setEditorVisible] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const group = groups.find((item) => item.id === id);
  const friendNames = useMemo(() => Object.fromEntries([
    [CURRENT_USER.id, CURRENT_USER.name],
    ...friends.map((friend) => [friend.id, friend.name]),
  ]), [friends]);

  const loadExpenses = async () => {
    if (!id) return;
    setExpensesLoading(true);
    setBalancesLoading(true);
    setSettlementsLoading(true);
    const [nextExpenses, nextBalances, nextSettlements] = await Promise.all([
      listByGroup(id),
      getGroupBalances(id),
      listSettlementsByGroup(id),
    ]);
    setExpenses(nextExpenses);
    setBalances(nextBalances);
    setSettlements(nextSettlements);
    setExpensesLoading(false);
    setBalancesLoading(false);
    setSettlementsLoading(false);
  };

  useEffect(() => {
    refreshFriends();
    loadExpenses();
  }, [id]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl },
    headerActions: { marginLeft: "auto", flexDirection: "row", gap: spacing.sm },
    iconButton: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
    hero: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, marginBottom: spacing.xl },
    balanceCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.xl },
    balanceRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    balanceAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
    balanceCopy: { flex: 1 },
    icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
    member: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
    muted: { color: colors.textMuted },
    sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
    expenseCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
    expenseRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    expenseIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.expenseIconBackground, alignItems: "center", justifyContent: "center" },
    expenseMeta: { flex: 1 },
    modal: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
    input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, color: colors.text, fontSize: 16, backgroundColor: colors.background },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    settlementSummary: { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
    selectedChip: { borderColor: colors.primary, backgroundColor: colors.iconBackground },
  });

  if (loading) return <SafeAreaView style={styles.safe}><LoadingState message="Loading group…" /></SafeAreaView>;

  if (!group) return <SafeAreaView style={styles.safe}><View style={styles.content}><Pressable onPress={() => router.back()} style={styles.iconButton}><Ionicons name="arrow-back" size={21} color={colors.text} /></Pressable><AppText variant="h2" style={{ marginTop: spacing.xl }}>Group not found</AppText></View></SafeAreaView>;

  const names = group.memberIds.map((memberId) => friendNames[memberId] ?? memberId);
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const openEdit = async () => {
    await refreshFriends();
    setName(group.name);
    setSelected(group.memberIds.filter((memberId) => memberId !== CURRENT_USER.id));
    setEditorVisible(true);
  };

  const toggle = (friendId: string) => setSelected((current) => current.includes(friendId) ? current.filter((memberId) => memberId !== friendId) : [...current, friendId]);

  const save = async () => {
    if (!name.trim()) return;
    await updateGroup(group.id, { name: name.trim(), memberIds: [CURRENT_USER.id, ...selected] });
    setEditorVisible(false);
  };

  const openSettlement = () => {
    const current = balances.find((balance) => balance.userId === CURRENT_USER.id);
    if (!current || current.net >= -0.005) return;
    const creditors = balances.filter((balance) => balance.userId !== CURRENT_USER.id && balance.net > 0.005);
    if (creditors.length === 0) return;
    const target = creditors[0];
    setSettlementTarget(target.userId);
    setSettlementAmount(Math.min(Math.abs(current.net), target.net).toFixed(2));
    setSettlementVisible(true);
  };

  const saveSettlement = async () => {
    if (!id || !settlementTarget) return;
    const amount = Number(settlementAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const current = balances.find((balance) => balance.userId === CURRENT_USER.id);
    const target = balances.find((balance) => balance.userId === settlementTarget);
    if (!current || !target || amount > Math.abs(current.net) + 0.005 || amount > target.net + 0.005) {
      Alert.alert("Invalid amount", "Enter an amount within the current balances.");
      return;
    }
    const result = await createSettlement({
      groupId: id,
      fromUserId: CURRENT_USER.id,
      toUserId: settlementTarget,
      amount: Math.round(amount * 100) / 100,
      date: new Date().toISOString().slice(0, 10),
    });
    if (!result) return;
    setSettlementVisible(false);
    setSettlementTarget("");
    setSettlementAmount("");
    await loadExpenses();
  };

  const confirmDelete = () => {
    Alert.alert("Delete group?", `This will remove “${group.name}” from your groups.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteGroup(group.id); router.replace("/(tabs)/groups"); } },
    ]);
  };

  return <SafeAreaView style={styles.safe} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityLabel="Go back"><Ionicons name="arrow-back" size={21} color={colors.text} /></Pressable>
        <AppText variant="h2" numberOfLines={1} style={{ flex: 1 }}>{group.name}</AppText>
        <View style={styles.headerActions}>
          <Pressable onPress={openEdit} style={styles.iconButton} accessibilityLabel="Edit group"><Ionicons name="create-outline" size={20} color={colors.primary} /></Pressable>
          <Pressable onPress={confirmDelete} style={styles.iconButton} accessibilityLabel="Delete group"><Ionicons name="trash-outline" size={20} color={colors.danger} /></Pressable>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.icon}><Ionicons name="people-outline" size={27} color={colors.primary} /></View>
        <AppText variant="title">{group.name}</AppText>
        <AppText variant="body" style={styles.muted}>{names.length} members · {formatMoney(totalSpent)} spent</AppText>
      </View>

      <AppText variant="h2" style={{ marginBottom: spacing.sm }}>Balances</AppText>
      <View style={styles.balanceCard}>
        {balancesLoading ? <LoadingState message="Calculating balances…" /> : balances.length === 0 ? (
          <AppText variant="body" style={styles.muted}>Add an expense to see who owes what.</AppText>
        ) : balances.map((balance, index) => {
          const memberName = friendNames[balance.userId] ?? balance.userId;
          const positive = balance.net > 0;
          const neutral = Math.abs(balance.net) < 0.005;
          return <View key={balance.userId} style={[styles.balanceRow, index === balances.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={styles.balanceAvatar}><AppText variant="caption">{memberName.slice(0, 1).toUpperCase()}</AppText></View>
            <View style={styles.balanceCopy}>
              <AppText variant="bodyMedium">{memberName}</AppText>
              <AppText variant="caption" style={styles.muted}>{formatMoney(balance.paid)} paid · {formatMoney(balance.owed)} share</AppText>
            </View>
            <AppText variant="bodyMedium" style={{ color: neutral ? colors.textMuted : positive ? colors.success : colors.danger }}>
              {neutral ? "Settled" : positive ? `+ ${formatMoney(balance.net)}` : `- ${formatMoney(Math.abs(balance.net))}`}
            </AppText>
          </View>;
        })}
      </View>

      {balances.length > 0 ? (() => {
        const current = balances.find((balance) => balance.userId === CURRENT_USER.id);
        const net = current?.net ?? 0;
        return <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl }}>
          <AppText variant="bodyMedium">{Math.abs(net) < 0.005 ? "You're settled up" : net > 0 ? `You're owed ${formatMoney(net)}` : `You owe ${formatMoney(Math.abs(net))}`}</AppText>
          <AppText variant="caption" style={styles.muted}>Based on expenses and recorded settlements in this group.</AppText>
          {net < -0.005 ? <Pressable onPress={openSettlement} style={{ marginTop: spacing.md }}>
            <AppText variant="bodyMedium" style={{ color: colors.primary }}>Settle up</AppText>
          </Pressable> : null}
        </View>;
      })() : null}

      <AppText variant="h2" style={{ marginBottom: spacing.sm }}>Settlement history</AppText>
      {settlementsLoading ? <LoadingState message="Loading settlements…" /> : settlements.length === 0 ? (
        <View style={styles.settlementSummary}>
          <AppText variant="bodyMedium">No settlements yet</AppText>
          <AppText variant="caption" style={styles.muted}>Recorded payments between group members will appear here.</AppText>
        </View>
      ) : settlements.map((settlement) => (
        <View key={settlement.id} style={styles.settlementSummary}>
          <AppText variant="bodyMedium">{friendNames[settlement.fromUserId] ?? settlement.fromUserId} paid {friendNames[settlement.toUserId] ?? settlement.toUserId}</AppText>
          <AppText variant="caption" style={styles.muted}>{settlement.date} · {formatMoney(settlement.amount)}</AppText>
        </View>
      ))}

            <View style={styles.sectionHeader}>
        <AppText variant="h2">Expenses</AppText>
        <Pressable onPress={() => router.push("/expenses/new")} accessibilityRole="button">
          <AppText variant="bodyMedium" style={{ color: colors.primary }}>+ Add expense</AppText>
        </Pressable>
      </View>

      {expensesLoading ? <LoadingState message="Loading expenses…" /> : expenses.length === 0 ? (
        <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl }}>
          <AppText variant="bodyMedium">No expenses yet</AppText>
          <AppText variant="caption" style={styles.muted}>Add an expense and select this group to start tracking shared spending.</AppText>
        </View>
      ) : expenses.map((expense) => (
        <View key={expense.id} style={styles.expenseCard}>
          <View style={styles.expenseRow}>
            <View style={styles.expenseIcon}><Ionicons name="receipt-outline" size={20} color={colors.primary} /></View>
            <View style={styles.expenseMeta}>
              <AppText variant="bodyMedium">{expense.description}</AppText>
              <AppText variant="caption" style={styles.muted}>{expense.date} · Paid by {friendNames[expense.paidBy] ?? expense.paidBy}</AppText>
            </View>
            <AppText variant="bodyMedium">{formatMoney(expense.amount)}</AppText>
          </View>
          {expense.splits?.length ? <AppText variant="caption" style={{ color: colors.textMuted, marginTop: spacing.sm }}>
            {expense.splits.map((split) => `${friendNames[split.userId] ?? split.userId}: ${formatMoney(split.amount)}`).join(" · ")}
          </AppText> : null}
        </View>
      ))}

      <AppText variant="h2" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>Members</AppText>
      <View>{names.map((memberName, index) => <View key={memberName + "-" + index} style={styles.member}><View style={styles.avatar}><AppText variant="caption">{memberName.slice(0, 1).toUpperCase()}</AppText></View><AppText variant="bodyMedium">{memberName}</AppText></View>)}</View>
    </ScrollView>

    <Modal visible={settlementVisible} transparent animationType="slide" onRequestClose={() => setSettlementVisible(false)}>
      <View style={styles.modal}><View style={styles.sheet}>
        <View style={styles.header}><AppText variant="h2">Settle up</AppText><Pressable onPress={() => setSettlementVisible(false)}><Ionicons name="close" size={24} color={colors.text} /></Pressable></View>
        <AppText variant="body" style={styles.muted}>Record a payment from You to {friendNames[settlementTarget] ?? settlementTarget}.</AppText>
        <TextInput value={settlementAmount} onChangeText={setSettlementAmount} placeholder="Amount" placeholderTextColor={colors.textMuted} style={styles.input} keyboardType="decimal-pad" />
        <PrimaryButton title={settlementSaving ? "Saving…" : "Record settlement"} onPress={saveSettlement} disabled={settlementSaving || !settlementAmount} />
      </View></View>
    </Modal>

    <Modal visible={editorVisible} transparent animationType="slide" onRequestClose={() => setEditorVisible(false)}>
      <View style={styles.modal}><View style={styles.sheet}>
        <View style={styles.header}><AppText variant="h2">Edit group</AppText><Pressable onPress={() => setEditorVisible(false)}><Ionicons name="close" size={24} color={colors.text} /></Pressable></View>
        <TextInput value={name} onChangeText={setName} placeholder="Group name" placeholderTextColor={colors.textMuted} style={styles.input} autoFocus />
        <AppText variant="bodyMedium">Members</AppText>
        <View style={styles.chips}>{friends.map((friend) => <Pressable key={friend.id} onPress={() => toggle(friend.id)} style={[styles.chip, selected.includes(friend.id) && styles.selectedChip]}><AppText variant="caption" style={selected.includes(friend.id) ? { color: colors.primary } : undefined}>{friend.name}</AppText></Pressable>)}</View>
        <PrimaryButton title="Save changes" onPress={save} disabled={!name.trim()} />
      </View></View>
    </Modal>
  </SafeAreaView>;
}

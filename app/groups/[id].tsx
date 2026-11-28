import { useCallback, useEffect, useMemo, useState } from "react";
import * as Linking from "expo-linking";
import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { GlassPanel } from "@/src/components/common/GlassPanel";
import { LoadingState } from "@/src/components/common/LoadingState";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { useGroups } from "@/src/hooks/useGroups";
import { useExpenses } from "@/src/hooks/useExpenses";
import { useSettlements } from "@/src/hooks/useSettlements";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";
import type { Expense, GroupBalance, GroupMember, Settlement } from "@/src/types/domain";

function formatMoney(value: number) {
  return "₹" + value.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    groups,
    loading,
    updateGroup,
    deleteGroup,
    createInvite,
    listMembers,
  } = useGroups();
  const { listByGroup, getGroupBalances } = useExpenses();
  const {
    listByGroup: listSettlementsByGroup,
    createSettlement,
    confirmSettlement,
    saving: settlementSaving,
  } = useSettlements();

  const currentUid = user?.id ?? "";
  const group = groups.find((item) => item.id === id);
  const isOwner = Boolean(group?.createdByUid && group.createdByUid === currentUid);

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [balances, setBalances] = useState<GroupBalance[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [settlementsLoading, setSettlementsLoading] = useState(true);
  const [settlementVisible, setSettlementVisible] = useState(false);
  const [settlementTarget, setSettlementTarget] = useState("");
  const [settlementAmount, setSettlementAmount] = useState("");
  const [settlementMethod, setSettlementMethod] = useState<"cash" | "upi">("upi");
  const [editorVisible, setEditorVisible] = useState(false);
  const [name, setName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const memberNames = useMemo(() => Object.fromEntries(
    members.map((member) => [member.uid, member.uid === currentUid ? "You" : member.displayName]),
  ) as Record<string, string>, [members, currentUid]);

  const getMemberName = (uid: string) => memberNames[uid] ?? (uid === currentUid ? "You" : "Member");

  const loadExpenses = useCallback(async () => {
    if (!id) return;
    setExpensesLoading(true);
    setBalancesLoading(true);
    setSettlementsLoading(true);
    try {
      const [nextExpenses, nextBalances, nextSettlements] = await Promise.all([
        listByGroup(id),
        getGroupBalances(id),
        listSettlementsByGroup(id),
      ]);
      setExpenses(nextExpenses);
      setBalances(nextBalances);
      setSettlements(nextSettlements);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "We couldn't load this group's activity.");
    } finally {
      setExpensesLoading(false);
      setBalancesLoading(false);
      setSettlementsLoading(false);
    }
  }, [id, listByGroup, getGroupBalances, listSettlementsByGroup]);

  useEffect(() => {
    let active = true;
    if (!id) return;
    setMembers([]);
    listMembers(id)
      .then((next) => { if (active) setMembers(next); })
      .catch((cause: unknown) => {
        if (active) setActionError(cause instanceof Error ? cause.message : "We couldn't load group members.");
      });
    void loadExpenses();
    return () => { active = false; };
  }, [id, listMembers, loadExpenses]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl },
    headerActions: { marginLeft: "auto", flexDirection: "row", gap: spacing.sm },
    iconButton: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.glassGradient[0], borderWidth: 1, borderColor: colors.glassBorder, alignItems: "center", justifyContent: "center" },
    hero: { marginBottom: spacing.xl },
    balanceCard: { marginBottom: spacing.xl },
    balanceRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    balanceAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
    balanceCopy: { flex: 1 },
    icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
    member: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
    muted: { color: colors.textMuted },
    sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
    expenseCard: { marginBottom: spacing.sm },
    expenseRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    expenseIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.expenseIconBackground, alignItems: "center", justifyContent: "center" },
    expenseMeta: { flex: 1 },
    modal: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
    sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    sheetContent: { gap: spacing.lg, paddingBottom: spacing.xxl - spacing.lg },
    input: { minHeight: 52, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radius.md, paddingHorizontal: spacing.lg, color: colors.text, fontSize: 16, backgroundColor: colors.glassGradient[0] },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassGradient[0] },
    selectedChip: { borderColor: colors.primary, backgroundColor: colors.iconBackground },
    settlementSummary: { marginBottom: spacing.lg, gap: spacing.xs },
  });

  if (loading) {
    return <SafeAreaView style={styles.safe}><GlassPanel padding={spacing.xl}><LoadingState message="Loading group…" /></GlassPanel></SafeAreaView>;
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}><Ionicons name="arrow-back" size={21} color={colors.text} /></Pressable>
          <AppText variant="h2" style={{ marginTop: spacing.xl }}>Group not found</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const shareInvite = async () => {
    if (!id || inviteLoading) return;
    setInviteLoading(true);
    setActionError(null);
    try {
      const inviteId = await createInvite(id);
      const link = Linking.createURL("group-invite/" + inviteId);
      await Share.share({
        message: "Join my " + group.name + " group on DeepPay. Open this invitation in DeepPay: " + link + "\nThis invitation expires in 7 days.",
        url: link,
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "We couldn't create a group invitation.";
      setActionError(message);
      Alert.alert("Invitation unavailable", message);
    } finally {
      setInviteLoading(false);
    }
  };

  const openEdit = () => {
    setName(group.name);
    setEditorVisible(true);
  };

  const saveGroupName = async () => {
    if (!name.trim() || !isOwner) return;
    try {
      await updateGroup(group.id, { name: name.trim(), memberIds: group.memberIds });
      setEditorVisible(false);
    } catch (cause) {
      Alert.alert("Couldn't update group", cause instanceof Error ? cause.message : "Please try again.");
    }
  };

  const confirmArchive = () => {
    Alert.alert("Archive group?", "This hides the group from your active groups. Its expense history is retained.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteGroup(group.id);
            router.replace("/(tabs)/groups" as any);
          } catch (cause) {
            Alert.alert("Couldn't archive group", cause instanceof Error ? cause.message : "Please try again.");
          }
        },
      },
    ]);
  };

  const openSettlement = () => {
    const current = balances.find((balance) => balance.userId === currentUid);
    if (!current || current.net >= -0.005) return;
    const creditors = balances.filter((balance) => balance.userId !== currentUid && balance.net > 0.005);
    const target = creditors[0];
    if (!target) return;
    setSettlementTarget(target.userId);
    setSettlementAmount(Math.min(Math.abs(current.net), target.net).toFixed(2));
    setSettlementMethod("upi");
    setSettlementVisible(true);
  };

  const saveSettlement = async () => {
    if (!id || !settlementTarget || !currentUid) return;
    const amount = Number(settlementAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const current = balances.find((balance) => balance.userId === currentUid);
    const target = balances.find((balance) => balance.userId === settlementTarget);
    if (!current || !target || amount > Math.abs(current.net) + 0.005 || amount > target.net + 0.005) {
      Alert.alert("Invalid amount", "Enter an amount within the current balances.");
      return;
    }

    const result = await createSettlement({
      groupId: id,
      fromUserId: currentUid,
      toUserId: settlementTarget,
      amount: Math.round(amount * 100) / 100,
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: settlementMethod,
    });
    if (!result) return;
    setSettlementVisible(false);
    setSettlementTarget("");
    setSettlementAmount("");
    await loadExpenses();
  };

  const handleConfirmSettlement = (settlement: Settlement) => {
    Alert.alert("Confirm payment received?", "Only confirm if ₹" + settlement.amount.toFixed(2) + " has reached your account or you have received it in cash.", [
      { text: "Not now", style: "cancel" },
      {
        text: "Confirm receipt",
        onPress: async () => {
          try {
            await confirmSettlement(group.id, settlement.id);
            await loadExpenses();
          } catch (cause) {
            Alert.alert("Couldn't confirm payment", cause instanceof Error ? cause.message : "Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </Pressable>
          <AppText variant="h2" numberOfLines={1} style={{ flex: 1 }}>{group.name}</AppText>
          <View style={styles.headerActions}>
            <Pressable onPress={shareInvite} disabled={inviteLoading} style={styles.iconButton} accessibilityLabel="Invite group members">
              <Ionicons name="person-add-outline" size={20} color={inviteLoading ? colors.textMuted : colors.primary} />
            </Pressable>
            {isOwner ? (
              <>
                <Pressable onPress={openEdit} style={styles.iconButton} accessibilityLabel="Edit group name">
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </Pressable>
                <Pressable onPress={confirmArchive} style={styles.iconButton} accessibilityLabel="Archive group">
                  <Ionicons name="archive-outline" size={20} color={colors.danger} />
                </Pressable>
              </>
            ) : null}
          </View>
        </View>

        <GlassPanel padding={spacing.xl} style={styles.hero}>
          <View style={styles.icon}><Ionicons name="people-outline" size={27} color={colors.primary} /></View>
          <AppText variant="title">{group.name}</AppText>
          <AppText variant="body" style={styles.muted}>{group.memberIds.length} members · {formatMoney(totalSpent)} spent</AppText>
          <Pressable onPress={shareInvite} disabled={inviteLoading} style={{ marginTop: spacing.md }}>
            <AppText variant="bodyMedium" style={{ color: colors.primary }}>{inviteLoading ? "Preparing invite…" : "Invite people to this group"}</AppText>
          </Pressable>
        </GlassPanel>

        {actionError ? (
          <GlassPanel padding={spacing.md} style={{ marginBottom: spacing.md }}>
            <AppText variant="caption" style={{ color: colors.danger }}>{actionError}</AppText>
          </GlassPanel>
        ) : null}

        <AppText variant="h2" style={{ marginBottom: spacing.sm }}>Balances</AppText>
        <GlassPanel padding={spacing.lg} style={styles.balanceCard}>
          {balancesLoading ? <LoadingState message="Calculating balances…" /> : balances.length === 0 ? (
            <AppText variant="body" style={styles.muted}>Add an expense to see who owes what.</AppText>
          ) : balances.map((balance, index) => {
            const memberName = getMemberName(balance.userId);
            const positive = balance.net > 0;
            const neutral = Math.abs(balance.net) < 0.005;
            return (
              <View key={balance.userId} style={[styles.balanceRow, index === balances.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.balanceAvatar}><AppText variant="caption">{memberName.slice(0, 1).toUpperCase()}</AppText></View>
                <View style={styles.balanceCopy}>
                  <AppText variant="bodyMedium">{memberName}</AppText>
                  <AppText variant="caption" style={styles.muted}>{formatMoney(balance.paid)} paid · {formatMoney(balance.owed)} share</AppText>
                </View>
                <AppText variant="bodyMedium" style={{ color: neutral ? colors.textMuted : positive ? colors.success : colors.danger }}>
                  {neutral ? "Settled" : positive ? "+ " + formatMoney(balance.net) : "- " + formatMoney(Math.abs(balance.net))}
                </AppText>
              </View>
            );
          })}
        </GlassPanel>

        {balances.length > 0 ? (() => {
          const current = balances.find((balance) => balance.userId === currentUid);
          const net = current?.net ?? 0;
          return (
            <GlassPanel padding={spacing.lg} style={{ marginBottom: spacing.xl }}>
              <AppText variant="bodyMedium">{Math.abs(net) < 0.005 ? "You're settled up" : net > 0 ? "You're owed " + formatMoney(net) : "You owe " + formatMoney(Math.abs(net))}</AppText>
              <AppText variant="caption" style={styles.muted}>Only recipient-confirmed settlements change these balances.</AppText>
              {net < -0.005 ? (
                <Pressable onPress={openSettlement} style={{ marginTop: spacing.md }}>
                  <AppText variant="bodyMedium" style={{ color: colors.primary }}>Settle up</AppText>
                </Pressable>
              ) : null}
            </GlassPanel>
          );
        })() : null}

        <AppText variant="h2" style={{ marginBottom: spacing.sm }}>Settlement history</AppText>
        {settlementsLoading ? <LoadingState message="Loading settlements…" /> : settlements.length === 0 ? (
          <GlassPanel padding={spacing.lg} style={styles.settlementSummary}>
            <AppText variant="bodyMedium">No settlements yet</AppText>
            <AppText variant="caption" style={styles.muted}>Payments recorded between group members will appear here.</AppText>
          </GlassPanel>
        ) : settlements.map((settlement) => (
          <GlassPanel key={settlement.id} padding={spacing.lg} style={styles.settlementSummary}>
            <AppText variant="bodyMedium">{getMemberName(settlement.fromUserId)} paid {getMemberName(settlement.toUserId)}</AppText>
            <AppText variant="caption" style={styles.muted}>
              {settlement.date} · {formatMoney(settlement.amount)} · {settlement.paymentMethod === "upi" ? "UPI" : "Cash"}
            </AppText>
            <AppText variant="caption" style={{ color: settlement.status === "confirmed" ? colors.success : settlement.status === "rejected" ? colors.danger : colors.textMuted }}>
              {settlement.status === "confirmed" ? "Receipt confirmed" : settlement.status === "rejected" ? "Payment not received" : "Awaiting recipient confirmation"}
            </AppText>
            {settlement.toUserId === currentUid && settlement.status === "payer_marked_paid" ? (
              <Pressable onPress={() => handleConfirmSettlement(settlement)} style={{ marginTop: spacing.sm }}>
                <AppText variant="bodyMedium" style={{ color: colors.primary }}>Confirm receipt</AppText>
              </Pressable>
            ) : null}
          </GlassPanel>
        ))}

        <View style={styles.sectionHeader}>
          <AppText variant="h2">Expenses</AppText>
          <Pressable onPress={() => router.push({ pathname: "/expenses/new", params: { groupId: id } })} accessibilityRole="button">
            <AppText variant="bodyMedium" style={{ color: colors.primary }}>+ Add expense</AppText>
          </Pressable>
        </View>

        {expensesLoading ? <LoadingState message="Loading expenses…" /> : expenses.length === 0 ? (
          <GlassPanel padding={spacing.lg} style={{ marginBottom: spacing.xl }}>
            <AppText variant="bodyMedium">No expenses yet</AppText>
            <AppText variant="caption" style={styles.muted}>Add an expense to start tracking shared spending.</AppText>
          </GlassPanel>
        ) : expenses.map((expense) => (
          <GlassPanel key={expense.id} padding={spacing.md} style={styles.expenseCard}>
            <View style={styles.expenseRow}>
              <View style={styles.expenseIcon}><Ionicons name="receipt-outline" size={20} color={colors.primary} /></View>
              <View style={styles.expenseMeta}>
                <AppText variant="bodyMedium">{expense.description}</AppText>
                <AppText variant="caption" style={styles.muted}>{expense.date} · Paid by {getMemberName(expense.paidBy)} · {expense.paymentMethod ?? "unknown"}</AppText>
              </View>
              <AppText variant="bodyMedium">{formatMoney(expense.amount)}</AppText>
            </View>
            {expense.splits?.length ? (
              <AppText variant="caption" style={{ color: colors.textMuted, marginTop: spacing.sm }}>
                {expense.splits.map((split) => getMemberName(split.userId) + ": " + formatMoney(split.amount)).join(" · ")}
              </AppText>
            ) : null}
          </GlassPanel>
        ))}

        <AppText variant="h2" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>Members</AppText>
        <View>
          {members.map((member) => (
            <View key={member.uid} style={styles.member}>
              <View style={styles.avatar}><AppText variant="caption">{member.displayName.slice(0, 1).toUpperCase()}</AppText></View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMedium">{member.uid === currentUid ? "You" : member.displayName}</AppText>
                <AppText variant="caption" style={styles.muted}>{member.role === "owner" ? "Group owner" : "Member"}</AppText>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={settlementVisible} transparent animationType="slide" onRequestClose={() => setSettlementVisible(false)}>
        <View style={styles.modal}>
          <GlassPanel padding={spacing.lg} style={styles.sheet}>
            <View style={styles.sheetContent}>
              <View style={styles.header}>
                <AppText variant="h2">Settle up</AppText>
                <Pressable onPress={() => setSettlementVisible(false)}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
              </View>
              <AppText variant="body" style={styles.muted}>Record a payment from You to {getMemberName(settlementTarget)}. The recipient must confirm receipt before the balance changes.</AppText>
              <TextInput value={settlementAmount} onChangeText={setSettlementAmount} placeholder="Amount" placeholderTextColor={colors.textMuted} style={styles.input} keyboardType="decimal-pad" />
              <AppText variant="bodyMedium">Payment method</AppText>
              <View style={styles.chips}>
                {(["upi", "cash"] as const).map((method) => (
                  <Pressable key={method} onPress={() => setSettlementMethod(method)} style={[styles.chip, settlementMethod === method && styles.selectedChip]}>
                    <AppText variant="caption" style={settlementMethod === method ? { color: colors.primary } : undefined}>{method === "upi" ? "UPI" : "Cash"}</AppText>
                  </Pressable>
                ))}
              </View>
              <PrimaryButton title={settlementSaving ? "Saving…" : "I have paid"} onPress={saveSettlement} disabled={settlementSaving || !settlementAmount} />
            </View>
          </GlassPanel>
        </View>
      </Modal>

      <Modal visible={editorVisible} transparent animationType="slide" onRequestClose={() => setEditorVisible(false)}>
        <View style={styles.modal}>
          <GlassPanel padding={spacing.lg} style={styles.sheet}>
            <View style={styles.sheetContent}>
              <View style={styles.header}>
                <AppText variant="h2">Edit group name</AppText>
                <Pressable onPress={() => setEditorVisible(false)}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
              </View>
              <TextInput value={name} onChangeText={setName} placeholder="Group name" placeholderTextColor={colors.textMuted} style={styles.input} autoFocus maxLength={60} />
              <AppText variant="caption" style={styles.muted}>Add or remove members using group invitations.</AppText>
              <PrimaryButton title="Save changes" onPress={saveGroupName} disabled={!name.trim()} />
            </View>
          </GlassPanel>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

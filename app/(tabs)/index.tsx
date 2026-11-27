import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { ExpenseRow } from "@/src/components/common/ExpenseRow";
import { QuickAction } from "@/src/components/common/QuickAction";
import { SectionHeader } from "@/src/components/common/SectionHeader";
import { EmptyState } from "@/src/components/common/EmptyState";
import { ErrorState } from "@/src/components/common/ErrorState";
import { LoadingState } from "@/src/components/common/LoadingState";
import { BottomTabBar } from "@/src/components/navigation/BottomTabBar";
import { CreateActionSheet } from "@/src/components/navigation/CreateActionSheet";
import { useHomeData } from "@/src/hooks/useHomeData";
import { brand } from "@/src/config/brand";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { summary, expenses, groups, loading, error, refresh } = useHomeData();
  const [sheetVisible, setSheetVisible] = useState(false);

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));

  const openCreate = () => setSheetVisible(true);
  const goToGroups = () => router.push("/(tabs)/groups" as any);

  const handleQuickAction = (label: "Expense" | "Split" | "Groups" | "Friends") => {
    if (label === "Expense") {
      router.push("/expenses/new");
      return;
    }

    if (label === "Split") {
      router.push({ pathname: "/expenses/new", params: { intent: "split" } });
      return;
    }

    if (label === "Groups") {
      goToGroups();
      return;
    }

    router.push("/friends");
  };

  const goTo = (tab: "home" | "groups" | "activity" | "profile") => {
    if (tab === "home") return;
    router.push(`/(tabs)/${tab}` as any);
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: 112 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl },
    headerText: { flex: 1, gap: 2 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center" },
    summaryCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },
    summaryEyebrow: { color: colors.textMuted, marginBottom: spacing.sm },
    totalAmount: { marginTop: spacing.sm },
    summaryDescription: { color: colors.textMuted, marginTop: spacing.xs },
    balanceRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
    balanceItem: { flex: 1, gap: spacing.xs, minHeight: 58 },
    balanceLabel: { color: colors.textMuted },
    balanceHint: { color: colors.textMuted, marginTop: spacing.xs },
    actions: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xl },
    section: { marginBottom: spacing.xl },
    groupList: { paddingRight: spacing.lg, gap: spacing.md },
    groupCard: { width: 208, minHeight: 92, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md },
    groupIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center" },
    groupText: { flex: 1, gap: 2 },
    groupEmpty: { minHeight: 82, borderRadius: radius.lg, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
    list: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
    retry: { alignItems: "center", paddingBottom: spacing.md },
  });

  const visibleExpenses = expenses.slice(0, 4);
  const visibleGroups = groups.slice(0, 4);

  return <SafeAreaView style={styles.safe} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="caption" style={{ color: colors.textMuted }}>{getGreeting()} 👋</AppText>
          <AppText variant="title">{brand.name}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          onPress={() => router.push("/(tabs)/profile" as any)}
          style={styles.avatar}
        >
          <Ionicons name="person-outline" size={21} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <AppText variant="caption" style={styles.summaryEyebrow}>MONTHLY OVERVIEW · {summary?.monthLabel ?? "THIS MONTH"}</AppText>
        <AppText variant="amount" style={styles.totalAmount}>
          {summary ? formatMoney(summary.totalSpent) : loading ? "Loading…" : "—"}
        </AppText>
        <AppText variant="caption" style={styles.summaryDescription}>Your share of expenses this month</AppText>

        <View style={styles.balanceRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View groups and amounts you owe"
            onPress={goToGroups}
            style={styles.balanceItem}
          >
            <AppText variant="caption" style={styles.balanceLabel}>You owe</AppText>
            <AppText variant="bodyMedium">{summary ? formatMoney(summary.youOwe) : "—"}</AppText>
            <AppText variant="caption" style={styles.balanceHint}>Across groups</AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View groups and amounts owed to you"
            onPress={goToGroups}
            style={styles.balanceItem}
          >
            <AppText variant="caption" style={styles.balanceLabel}>Owed to you</AppText>
            <AppText variant="bodyMedium" style={{ color: colors.success }}>
              {summary ? formatMoney(summary.owedToYou) : "—"}
            </AppText>
            <AppText variant="caption" style={styles.balanceHint}>Across groups</AppText>
          </Pressable>
        </View>
      </View>

      <SectionHeader title="Quick actions" />
      <View style={styles.actions}>
        {([
          { label: "Expense", icon: "add-circle-outline" },
          { label: "Split", icon: "git-branch-outline" },
          { label: "Groups", icon: "people-outline" },
          { label: "Friends", icon: "person-add-outline" },
        ] as const).map(({ label, icon }) => (
          <QuickAction
            key={label}
            label={label}
            icon={icon}
            onPress={() => handleQuickAction(label)}
          />
        ))}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Your groups" action={groups.length ? "See all" : undefined} onAction={goToGroups} />
        {loading && !groups.length ? <LoadingState message="Loading your groups…" /> : visibleGroups.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupList}>
            {visibleGroups.map((group) => (
              <Pressable
                key={group.id}
                accessibilityRole="button"
                accessibilityLabel={`Open ${group.name}, ${group.memberIds.length} members`}
                onPress={() => router.push(`/groups/${group.id}` as any)}
                style={styles.groupCard}
              >
                <View style={styles.groupIcon}><Ionicons name="people-outline" size={20} color={colors.primary} /></View>
                <View style={styles.groupText}>
                  <AppText variant="bodyMedium" numberOfLines={1}>{group.name}</AppText>
                  <AppText variant="caption" style={{ color: colors.textMuted }}>
                    {group.memberIds.length} {group.memberIds.length === 1 ? "member" : "members"}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Pressable accessibilityRole="button" onPress={goToGroups} style={styles.groupEmpty}>
            <View style={styles.groupIcon}><Ionicons name="add" size={21} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyMedium">Create your first group</AppText>
              <AppText variant="caption" style={{ color: colors.textMuted }}>For trips, roommates or shared bills</AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Recent expenses" />
        <View style={styles.list}>
          {loading ? <LoadingState message="Loading your expenses…" /> : error ? (
            <Pressable accessibilityRole="button" onPress={() => void refresh()}>
              <ErrorState message={error} />
              <View style={styles.retry}><AppText variant="caption" style={{ color: colors.primary }}>Tap to try again</AppText></View>
            </Pressable>
          ) : expenses.length ? visibleExpenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} />) : (
            <EmptyState icon="receipt-outline" title="No expenses yet" message="Add your first expense to start tracking where your money goes." />
          )}
        </View>
      </View>
    </ScrollView>

    <BottomTabBar activeTab="home" onTabPress={goTo} onAddPress={openCreate} />
    <CreateActionSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
  </SafeAreaView>;
}

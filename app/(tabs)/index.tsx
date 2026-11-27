import { useCallback, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
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
    content: { padding: spacing.lg, paddingBottom: 144 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl },
    headerText: { flex: 1, gap: 2 },
    avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 7, elevation: 2 },
    hero: { borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.xl, overflow: "hidden", shadowColor: colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.24, shadowRadius: 18, elevation: 8 },
    heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    heroEyebrow: { color: "rgba(255,255,255,0.82)", fontWeight: "800", letterSpacing: 1.05 },
    heroAmount: { color: "#FFFFFF", marginTop: spacing.md },
    heroDescription: { color: "rgba(255,255,255,0.82)", marginTop: spacing.xs },
    heroOrbLarge: { position: "absolute", width: 190, height: 190, borderRadius: 95, backgroundColor: "rgba(255,255,255,0.10)", top: -90, right: -55 },
    heroOrbSmall: { position: "absolute", width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(255,255,255,0.09)", bottom: 56, right: 92 },
    balanceRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
    balanceItem: { flex: 1, minHeight: 86, borderRadius: radius.md, padding: spacing.md, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.19)", justifyContent: "space-between" },
    balanceLabel: { color: "rgba(255,255,255,0.82)" },
    balanceValue: { color: "#FFFFFF", fontWeight: "800" },
    balanceOwedValue: { color: colors.accentYellow, fontWeight: "800" },
    balanceHint: { color: "rgba(255,255,255,0.68)" },
    actions: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xl },
    section: { marginBottom: spacing.xl },
    groupList: { paddingRight: spacing.lg, gap: spacing.md },
    groupCard: { width: 214, minHeight: 96, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md, shadowColor: "#20133D", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 9, elevation: 2 },
    groupIcon: { width: 46, height: 46, borderRadius: 18, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center" },
    groupText: { flex: 1, gap: 3 },
    groupEmpty: { minHeight: 88, borderRadius: radius.lg, borderWidth: 1, borderStyle: "dashed", borderColor: colors.primary, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
    list: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
    retry: { alignItems: "center", paddingBottom: spacing.md },
  });

  const visibleExpenses = expenses.slice(0, 4);
  const visibleGroups = groups.slice(0, 4);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
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
            <Ionicons name="person" size={21} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <LinearGradient colors={colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View pointerEvents="none" style={styles.heroOrbLarge} />
          <View pointerEvents="none" style={styles.heroOrbSmall} />
          <View style={styles.heroTop}>
            <AppText variant="caption" style={styles.heroEyebrow}>YOUR MONEY, IN THE LOOP ✨</AppText>
            <Ionicons name="sparkles" size={21} color={colors.accentYellow} />
          </View>
          <AppText variant="amount" style={styles.heroAmount}>
            {summary ? formatMoney(summary.totalSpent) : loading ? "Loading…" : "—"}
          </AppText>
          <AppText variant="caption" style={styles.heroDescription}>
            Your share of expenses · {summary?.monthLabel ?? "This month"}
          </AppText>
          <View style={styles.balanceRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View groups and amounts you owe"
              onPress={goToGroups}
              style={styles.balanceItem}
            >
              <AppText variant="caption" style={styles.balanceLabel}>↗ You owe</AppText>
              <AppText variant="h2" style={styles.balanceValue}>{summary ? formatMoney(summary.youOwe) : "—"}</AppText>
              <AppText variant="caption" style={styles.balanceHint}>Across groups</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View groups and amounts owed to you"
              onPress={goToGroups}
              style={styles.balanceItem}
            >
              <AppText variant="caption" style={styles.balanceLabel}>↙ Owed to you</AppText>
              <AppText variant="h2" style={styles.balanceOwedValue}>{summary ? formatMoney(summary.owedToYou) : "—"}</AppText>
              <AppText variant="caption" style={styles.balanceHint}>Across groups</AppText>
            </Pressable>
          </View>
        </View>

        <SectionHeader title="Quick actions" />
        <View style={styles.actions}>
          {([
            { label: "Expense", icon: "add-circle" },
            { label: "Split", icon: "git-branch" },
            { label: "Groups", icon: "people" },
            { label: "Friends", icon: "person-add" },
          ] as const).map(({ label, icon }) => (
            <QuickAction key={label} label={label} icon={icon} onPress={() => handleQuickAction(label)} />
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Your groups" action={groups.length ? "See all" : undefined} onAction={goToGroups} />
          {loading && !groups.length ? <LoadingState message="Loading your groups…" /> : visibleGroups.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupList}>
              {visibleGroups.map((group, index) => {
                const gradient = index % 2 === 0 ? colors.gradientSky : colors.gradientSunset;
                return (
                  <Pressable
                    key={group.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${group.name}, ${group.memberIds.length} members`}
                    onPress={() => router.push(`/groups/${group.id}` as any)}
                    style={styles.groupCard}
                  >
                    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.groupIcon}>
                      <Ionicons name="people" size={21} color={colors.onAccent} />
                    </LinearGradient>
                    <View style={styles.groupText}>
                      <AppText variant="bodyMedium" numberOfLines={1}>{group.name}</AppText>
                      <AppText variant="caption" style={{ color: colors.textMuted }}>
                        {group.memberIds.length} {group.memberIds.length === 1 ? "member" : "members"}
                      </AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <Pressable accessibilityRole="button" onPress={goToGroups} style={styles.groupEmpty}>
              <View style={styles.groupIcon}><Ionicons name="add" size={22} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMedium">Create your first group</AppText>
                <AppText variant="caption" style={{ color: colors.textMuted }}>For trips, roommates or shared bills</AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
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
              <EmptyState icon="receipt" title="Nothing spent yet" message="Add your first expense and let DeepPay keep everything in the loop." />
            )}
          </View>
        </View>
      </ScrollView>

      <BottomTabBar activeTab="home" onTabPress={goTo} onAddPress={openCreate} />
      <CreateActionSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </SafeAreaView>
  );
}

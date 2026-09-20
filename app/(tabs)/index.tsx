import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { ExpenseRow } from "@/src/components/common/ExpenseRow";
import { QuickAction } from "@/src/components/common/QuickAction";
import { SectionHeader } from "@/src/components/common/SectionHeader";
import { BottomTabBar } from "@/src/components/navigation/BottomTabBar";
import { CreateActionSheet } from "@/src/components/navigation/CreateActionSheet";
import { useHomeData } from "@/src/hooks/useHomeData";
import { brand } from "@/src/config/brand";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { summary, expenses, loading } = useHomeData();
  const [sheetVisible, setSheetVisible] = useState(false);
  const openCreate = () => setSheetVisible(true);
  const goTo = (tab: "home" | "groups" | "activity" | "profile") => {
    if (tab === "home") return;
    router.push(`/(tabs)/${tab}` as any);
  };
  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: 100 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center" },
    summaryCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xxl },
    month: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.sm },
    balanceRow: { flexDirection: "row", gap: 60, marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
    actions: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xxxl },
    list: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  });
  return <SafeAreaView style={styles.safe} edges={["top"]}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View><AppText variant="caption" style={{ color: colors.textMuted }}>Good morning 👋</AppText><AppText variant="title">{brand.name}</AppText></View><View style={styles.avatar}><AppText variant="bodyMedium">DS</AppText></View></View>
    <View style={styles.summaryCard}><View style={styles.month}><AppText variant="caption" style={{ color: colors.textMuted }}>{summary?.monthLabel ?? "September"}</AppText><Ionicons name="chevron-down" size={16} color={colors.textMuted} /></View><AppText variant="amount">₹{(summary?.totalSpent ?? 0).toLocaleString("en-IN")}</AppText><AppText variant="caption" style={{ color: colors.textMuted }}>total spent this month</AppText><View style={styles.balanceRow}><View><AppText variant="caption" style={{ color: colors.textMuted }}>You owe</AppText><AppText variant="bodyMedium">₹{summary?.youOwe ?? 0}</AppText></View><View><AppText variant="caption" style={{ color: colors.textMuted }}>Owed to you</AppText><AppText variant="bodyMedium" style={{ color: colors.success }}>₹{summary?.owedToYou ?? 0}</AppText></View></View></View>
    <SectionHeader title="Quick actions" /><View style={styles.actions}>{[["Scan","qr-code"],["Split","git-branch-outline"],["Request","arrow-down-circle-outline"],["Expense","add-circle-outline"]].map(([label, icon]) => <QuickAction key={label} label={label} icon={icon as keyof typeof Ionicons.glyphMap} onPress={openCreate} />)}</View>
    <SectionHeader title="Recent expenses" action="See all" />
    <View style={styles.list}>{loading ? <AppText style={{ color: colors.textMuted }}>Loading your expenses…</AppText> : expenses.length ? expenses.map(expense => <ExpenseRow key={expense.id} expense={expense} />) : <AppText style={{ color: colors.textMuted, paddingVertical: spacing.xl, textAlign: "center" }}>No expenses yet. Use + to add your first expense.</AppText>}</View>
  </ScrollView><BottomTabBar activeTab="home" onTabPress={goTo} onAddPress={openCreate} /><CreateActionSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} /></SafeAreaView>;
}

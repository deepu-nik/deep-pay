import { useCallback, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { ErrorState } from "@/src/components/common/ErrorState";
import { GlassPanel } from "@/src/components/common/GlassPanel";
import { LoadingState } from "@/src/components/common/LoadingState";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { useAuth } from "@/src/context/AuthContext";
import { firebaseBudgetService, type MonthlyBudget } from "@/src/services/firebase/budgetService";
import { calculateMonthlyInsights, INSIGHT_CATEGORIES } from "@/src/services/analytics/insightsUtils";
import { firebaseExpenseService } from "@/src/services/firebase/expenseService";
import type { ExpenseCategory } from "@/src/types/domain";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

function formatMoneyMinor(value: number) {
  return "₹" + (value / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number) {
  return Math.round(value) + "%";
}

export default function InsightsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Awaited<ReturnType<typeof firebaseExpenseService.listRecent>>>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>("Food");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [savingBudget, setSavingBudget] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextExpenses, nextBudgets] = await Promise.all([
        firebaseExpenseService.listRecent(),
        firebaseBudgetService.listMonthlyBudgets(),
      ]);
      setExpenses(nextExpenses);
      setBudgets(nextBudgets);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't load your insights. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));

  const insights = useMemo(
    () => calculateMonthlyInsights(expenses, user?.id ?? ""),
    [expenses, user?.id],
  );
  const budgetByCategory = useMemo(
    () => new Map<ExpenseCategory, MonthlyBudget>(budgets.map((budget): [ExpenseCategory, MonthlyBudget] => [budget.category, budget])),
    [budgets],
  );
  const totalBudgetMinor = budgets.reduce((sum, budget) => sum + budget.limitMinor, 0);
  const changePercent = insights.previousMonthSpentMinor > 0
    ? Math.round(((insights.totalSpentMinor - insights.previousMonthSpentMinor) / insights.previousMonthSpentMinor) * 100)
    : null;
  const changeLabel = changePercent === null
    ? insights.totalSpentMinor > 0 ? "No previous-month baseline" : "No previous-month data"
    : (changePercent > 0 ? "Up " : changePercent < 0 ? "Down " : "No change ") + Math.abs(changePercent) + "% vs last month";

  const openBudgetEditor = (category?: ExpenseCategory) => {
    const nextCategory = category
      ?? INSIGHT_CATEGORIES.find((item) => !budgetByCategory.has(item))
      ?? "Food";
    const existing = budgetByCategory.get(nextCategory);
    setSelectedCategory(nextCategory);
    setBudgetAmount(existing ? (existing.limitMinor / 100).toString() : "");
    setBudgetError(null);
    setEditorVisible(true);
  };

  const selectBudgetCategory = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    const existing = budgetByCategory.get(category);
    setBudgetAmount(existing ? (existing.limitMinor / 100).toString() : "");
    setBudgetError(null);
  };

  const saveBudget = async () => {
    const amount = Number(budgetAmount.replace(/,/g, ""));
    const limitMinor = Math.round(amount * 100);
    if (!Number.isFinite(amount) || !Number.isSafeInteger(limitMinor) || limitMinor <= 0) {
      setBudgetError("Enter a monthly limit greater than ₹0.");
      return;
    }
    if (limitMinor > 100000000000) {
      setBudgetError("The maximum supported monthly limit is ₹1,000,000,000.");
      return;
    }

    setSavingBudget(true);
    setBudgetError(null);
    try {
      const saved = await firebaseBudgetService.saveMonthlyBudget({
        category: selectedCategory,
        limitMinor,
      });
      setBudgets((current) => [
        ...current.filter((item) => item.category !== saved.category),
        saved,
      ].sort((a, b) => a.category.localeCompare(b.category)));
      setEditorVisible(false);
    } catch (cause) {
      setBudgetError(cause instanceof Error ? cause.message : "We couldn't save this budget. Please try again.");
    } finally {
      setSavingBudget(false);
    }
  };

  const removeSelectedBudget = async () => {
    setSavingBudget(true);
    setBudgetError(null);
    try {
      await firebaseBudgetService.removeMonthlyBudget(selectedCategory);
      setBudgets((current) => current.filter((item) => item.category !== selectedCategory));
      setEditorVisible(false);
    } catch (cause) {
      setBudgetError(cause instanceof Error ? cause.message : "We couldn't remove this budget. Please try again.");
    } finally {
      setSavingBudget(false);
    }
  };

  const confirmRemoveBudget = () => {
    Alert.alert(
      "Remove monthly budget?",
      "Your recorded expenses will stay as they are. Only this category's monthly limit will be removed.",
      [
        { text: "Keep budget", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => { void removeSelectedBudget(); } },
      ],
    );
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    headerIcon: {
      width: 44,
      height: 44,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.glassGradient[0],
    },
    headerCopy: { flex: 1, gap: 2 },
    subtitle: { color: colors.textMuted },
    hero: {
      borderRadius: radius.xl,
      padding: spacing.xl,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.glassBorder,
      gap: spacing.sm,
    },
    heroEyebrow: { color: "rgba(255,255,255,0.78)", fontWeight: "800", letterSpacing: 1.1 },
    heroAmount: { color: "#FFFFFF", marginTop: spacing.xs },
    heroHint: { color: "rgba(255,255,255,0.78)" },
    heroStats: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
    heroStat: {
      flex: 1,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: "rgba(255,255,255,0.14)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      gap: spacing.xs,
    },
    heroStatLabel: { color: "rgba(255,255,255,0.75)" },
    heroStatValue: { color: "#FFFFFF", fontWeight: "800" },
    heroStatHint: { color: "rgba(255,255,255,0.72)" },
    sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
    sectionTitle: { marginBottom: 2 },
    muted: { color: colors.textMuted },
    categoryList: { gap: spacing.lg },
    categoryRow: { gap: spacing.xs },
    categoryHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    categoryName: { fontWeight: "700" },
    categoryTrack: { height: 9, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, overflow: "hidden" },
    categoryFill: { height: "100%", borderRadius: radius.pill },
    budgetList: { gap: spacing.sm },
    budgetCard: { gap: spacing.sm },
    budgetCardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    budgetCopy: { flex: 1, gap: 2 },
    budgetAmount: { fontWeight: "800" },
    budgetFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    emptyBudget: { gap: spacing.md, alignItems: "flex-start" },
    note: { color: colors.textMuted, lineHeight: 19 },
    addBudgetButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingVertical: spacing.sm },
    modalRoot: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(5,4,12,0.55)" },
    modalScrim: { ...StyleSheet.absoluteFill },
    modalSheet: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.md,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      maxHeight: "88%",
    },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    categoryChoices: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    categoryChoice: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.glassGradient[0],
    },
    amountInput: {
      minHeight: 54,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      paddingHorizontal: spacing.md,
      color: colors.text,
      backgroundColor: colors.glassGradient[0],
      fontSize: 17,
      fontWeight: "700",
    },
    modalClose: {
      width: 38,
      height: 38,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.iconBackground,
    },
    removeButton: { alignItems: "center", paddingVertical: spacing.sm },
  });

  const hasSelectedBudget = budgetByCategory.has(selectedCategory);
  const budgetUsed = (category: ExpenseCategory) => (
    insights.categories.find((item) => item.category === category)?.amountMinor ?? 0
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.headerIcon}
          >
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="title">Insights</AppText>
            <AppText variant="caption" style={styles.subtitle}>Understand where your money goes.</AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh insights"
            onPress={() => { void refresh(); }}
            style={styles.headerIcon}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {loading ? (
          <GlassPanel><LoadingState message="Preparing your monthly insights…" /></GlassPanel>
        ) : error ? (
          <GlassPanel gap={spacing.md}>
            <ErrorState message={error} />
            <PrimaryButton title="Try again" onPress={() => { void refresh(); }} />
          </GlassPanel>
        ) : (
          <>
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View pointerEvents="none" style={{ position: "absolute", width: 170, height: 170, borderRadius: 85, backgroundColor: "rgba(255,255,255,0.10)", top: -90, right: -48 }} />
              <AppText variant="caption" style={styles.heroEyebrow}>YOUR SPENDING</AppText>
              <AppText variant="amount" style={styles.heroAmount}>{formatMoneyMinor(insights.totalSpentMinor)}</AppText>
              <AppText variant="caption" style={styles.heroHint}>{insights.monthLabel} · your share of recorded expenses</AppText>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <AppText variant="caption" style={styles.heroStatLabel}>Daily average</AppText>
                  <AppText variant="h2" style={styles.heroStatValue}>{formatMoneyMinor(insights.dailyAverageMinor)}</AppText>
                  <AppText variant="caption" style={styles.heroStatHint}>Over {insights.daysElapsed} days</AppText>
                </View>
                <View style={styles.heroStat}>
                  <AppText variant="caption" style={styles.heroStatLabel}>Month on month</AppText>
                  <AppText variant="bodyMedium" style={styles.heroStatValue}>{changeLabel}</AppText>
                  <AppText variant="caption" style={styles.heroStatHint}>
                    Previous: {formatMoneyMinor(insights.previousMonthSpentMinor)}
                  </AppText>
                </View>
              </View>
            </LinearGradient>

            <GlassPanel padding={spacing.lg} gap={spacing.md}>
              <View style={styles.sectionHeading}>
                <View style={{ flex: 1 }}>
                  <AppText variant="h2" style={styles.sectionTitle}>Category breakdown</AppText>
                  <AppText variant="caption" style={styles.muted}>Where your share went this month.</AppText>
                </View>
              </View>
              {insights.categories.length === 0 ? (
                <AppText variant="body" style={styles.muted}>No expenses recorded for this month yet. Add an expense to start building your insights.</AppText>
              ) : (
                <View style={styles.categoryList}>
                  {insights.categories.map((item) => (
                    <View key={item.category} style={styles.categoryRow}>
                      <View style={styles.categoryHead}>
                        <AppText variant="bodyMedium" style={styles.categoryName}>{item.category}</AppText>
                        <AppText variant="bodyMedium">{formatMoneyMinor(item.amountMinor)}</AppText>
                      </View>
                      <View style={styles.categoryTrack}>
                        <View style={[styles.categoryFill, { width: formatPercent(item.sharePercent), backgroundColor: colors.primary }]} />
                      </View>
                      <AppText variant="caption" style={styles.muted}>{formatPercent(item.sharePercent)} of this month's spend</AppText>
                    </View>
                  ))}
                </View>
              )}
            </GlassPanel>

            <View style={{ gap: spacing.md }}>
              <View style={styles.sectionHeading}>
                <View style={{ flex: 1 }}>
                  <AppText variant="h2">Monthly budgets</AppText>
                  <AppText variant="caption" style={styles.muted}>
                    {budgets.length ? formatMoneyMinor(totalBudgetMinor) + " planned across " + budgets.length + " categories" : "Set a monthly limit for the categories you care about."}
                  </AppText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add a monthly budget"
                  onPress={() => openBudgetEditor()}
                  style={styles.headerIcon}
                >
                  <Ionicons name="add" size={22} color={colors.primary} />
                </Pressable>
              </View>

              {budgets.length === 0 ? (
                <GlassPanel padding={spacing.lg} style={styles.emptyBudget}>
                  <View style={styles.headerIcon}>
                    <Ionicons name="wallet-outline" size={22} color={colors.primary} />
                  </View>
                  <AppText variant="bodyMedium">Give your spending a plan</AppText>
                  <AppText variant="caption" style={styles.muted}>Create category budgets and see how much of each limit you have used this month.</AppText>
                  <PrimaryButton title="Set your first budget" onPress={() => openBudgetEditor()} />
                </GlassPanel>
              ) : (
                <View style={styles.budgetList}>
                  {budgets.map((budget) => {
                    const spent = budgetUsed(budget.category);
                    const ratio = spent / budget.limitMinor;
                    const overBudget = ratio > 1;
                    const fillColor = overBudget ? colors.danger : colors.primary;
                    return (
                      <Pressable
                        key={budget.category}
                        accessibilityRole="button"
                        accessibilityLabel={"Edit " + budget.category + " monthly budget"}
                        onPress={() => openBudgetEditor(budget.category)}
                      >
                        <GlassPanel padding={spacing.md} gap={spacing.sm}>
                          <View style={styles.budgetCardTop}>
                            <View style={[styles.headerIcon, { width: 38, height: 38 }]}>
                              <Ionicons name="pie-chart-outline" size={18} color={colors.primary} />
                            </View>
                            <View style={styles.budgetCopy}>
                              <AppText variant="bodyMedium">{budget.category}</AppText>
                              <AppText variant="caption" style={styles.muted}>{formatMoneyMinor(spent)} spent of {formatMoneyMinor(budget.limitMinor)}</AppText>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                          </View>
                          <View style={styles.categoryTrack}>
                            <View style={[styles.categoryFill, { width: formatPercent(Math.min(100, ratio * 100)), backgroundColor: fillColor }]} />
                          </View>
                          <View style={styles.budgetFooter}>
                            <AppText variant="caption" style={{ color: overBudget ? colors.danger : colors.textMuted }}>
                              {overBudget ? "Over by " + formatMoneyMinor(spent - budget.limitMinor) : formatPercent(ratio * 100) + " used"}
                            </AppText>
                            <AppText variant="caption" style={styles.muted}>Monthly limit {formatMoneyMinor(budget.limitMinor)}</AppText>
                          </View>
                        </GlassPanel>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <AppText variant="caption" style={styles.note}>
              Insights use expenses recorded in DeepPay and your share of group splits. UPI handoff reports are excluded because they are not bank-verified. Budgets repeat each calendar month; they do not move or limit money in your bank account.
            </AppText>
          </>
        )}
      </ScrollView>

      <Modal visible={editorVisible} transparent animationType="slide" onRequestClose={() => setEditorVisible(false)}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close budget editor" onPress={() => setEditorVisible(false)} style={styles.modalScrim} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <AppText variant="h2">{hasSelectedBudget ? "Edit monthly budget" : "Set monthly budget"}</AppText>
                <AppText variant="caption" style={styles.muted}>Choose a category and its monthly spending limit.</AppText>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setEditorVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <AppText variant="bodyMedium">Category</AppText>
            <ScrollView style={{ maxHeight: 142 }} showsVerticalScrollIndicator={false}>
              <View style={styles.categoryChoices}>
                {INSIGHT_CATEGORIES.map((category) => {
                  const selected = category === selectedCategory;
                  return (
                    <Pressable
                      key={category}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => selectBudgetCategory(category)}
                      style={[
                        styles.categoryChoice,
                        selected && { backgroundColor: colors.iconBackground, borderColor: colors.primary },
                      ]}
                    >
                      <AppText variant="caption" style={{ color: selected ? colors.primary : colors.text }}>{category}</AppText>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <AppText variant="bodyMedium">Monthly limit (₹)</AppText>
            <TextInput
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              placeholder="e.g. 5000"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              style={styles.amountInput}
            />
            {budgetError ? <AppText variant="caption" style={{ color: colors.danger }}>{budgetError}</AppText> : null}
            <PrimaryButton title={savingBudget ? "Saving…" : "Save monthly budget"} onPress={() => { void saveBudget(); }} disabled={savingBudget} />
            {hasSelectedBudget ? (
              <Pressable accessibilityRole="button" disabled={savingBudget} onPress={confirmRemoveBudget} style={styles.removeButton}>
                <AppText variant="caption" style={{ color: colors.danger }}>Remove this budget</AppText>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

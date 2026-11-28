import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { EmptyState } from "@/src/components/common/EmptyState";
import { ErrorState } from "@/src/components/common/ErrorState";
import { GlassPanel } from "@/src/components/common/GlassPanel";
import { LoadingState } from "@/src/components/common/LoadingState";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { BottomTabBar, type TabKey } from "@/src/components/navigation/BottomTabBar";
import { CreateActionSheet } from "@/src/components/navigation/CreateActionSheet";
import { firebaseActivityService, type ActivityEntry } from "@/src/services/firebase/activityService";
import { useTheme } from "@/src/theme";
import { spacing } from "@/src/theme/tokens";

const sectionOrder = ["Today", "Yesterday", "This week", "Earlier"] as const;
type ActivitySection = (typeof sectionOrder)[number];

function formatMoney(value: number) {
  return "₹" + value.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function getSection(timestamp: number): ActivitySection {
  const eventDate = new Date(timestamp);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfEvent = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()).getTime();
  const daysAgo = Math.floor((startOfToday - startOfEvent) / 86400000);

  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return "This week";
  return "Earlier";
}

function formatActivityTime(timestamp: number, section: string) {
  const date = new Date(timestamp);
  if (section === "Today" || section === "Yesterday") {
    return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function ActivityRow({
  item,
  onPress,
}: {
  item: ActivityEntry;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const isExpense = item.kind === "expense";
  const icon = isExpense ? "receipt-outline" : "swap-horizontal-outline";
  const amountColor = item.direction === "out"
    ? colors.danger
    : item.direction === "in"
      ? colors.success
      : colors.text;
  const amountPrefix = item.direction === "out" ? "−" : item.direction === "in" ? "+" : "";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title + ", " + item.detail + ", " + formatMoney(item.amount)}
      onPress={onPress}
      style={({ pressed }) => [styles.activityRow, pressed && { opacity: 0.72 }]}
    >
      <LinearGradient
        colors={isExpense ? colors.gradientPrimary : colors.gradientMint}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.activityIcon}
      >
        <Ionicons name={icon} size={20} color={colors.onAccent} />
      </LinearGradient>
      <View style={styles.activityCopy}>
        <AppText variant="bodyMedium" numberOfLines={1}>{item.title}</AppText>
        <AppText variant="caption" style={{ color: colors.textMuted }} numberOfLines={1}>{item.detail}</AppText>
      </View>
      <View style={styles.activityAmount}>
        <AppText variant="bodyMedium" style={{ color: amountColor }}>
          {amountPrefix}{formatMoney(item.amount)}
        </AppText>
        <AppText variant="caption" style={{ color: colors.textMuted }}>
          {item.kind === "expense" ? "Expense" : "Settlement"}
        </AppText>
      </View>
    </Pressable>
  );
}

export default function ActivityScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [items, setItems] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextItems = await firebaseActivityService.listRecent();
      setItems(nextItems);
    } catch {
      setError("We couldn't load your activity. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));

  const goTo = (tab: TabKey) => {
    if (tab === "activity") return;
    router.replace((tab === "home" ? "/(tabs)" : "/(tabs)/" + tab) as any);
  };

  const buckets: Record<(typeof sectionOrder)[number], ActivityEntry[]> = {
    Today: [],
    Yesterday: [],
    "This week": [],
    Earlier: [],
  };
  items.forEach((item) => buckets[getSection(item.timestamp)].push(item));
  const expenseCount = items.filter((item) => item.kind === "expense").length;
  const settlementCount = items.filter((item) => item.kind === "settlement").length;

  const localStyles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: 145, gap: spacing.lg },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    subtitle: { color: colors.textMuted, marginTop: 3 },
    headerButton: { width: 46, height: 46, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassGradient[0] },
    summary: { flexDirection: "row", gap: spacing.md },
    summaryCard: { flex: 1 },
    summaryIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.iconBackground, marginBottom: spacing.sm },
    summaryNumber: { fontSize: 23, lineHeight: 28, fontWeight: "800" },
    section: { gap: spacing.sm },
    sectionTitle: { marginHorizontal: 3 },
    timeline: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
    timelineRow: { minHeight: 82 },
    activityRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
    activityIcon: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    activityCopy: { flex: 1, gap: 3 },
    activityAmount: { alignItems: "flex-end", gap: 3 },
    separator: { height: 1, backgroundColor: colors.glassBorder, marginLeft: 60 },
    emptyCard: { alignItems: "center", gap: spacing.md },
    errorAction: { alignItems: "center", paddingTop: spacing.md },
    note: { color: colors.textMuted, lineHeight: 19 },
  });

  return (
    <SafeAreaView style={localStyles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={localStyles.content} showsVerticalScrollIndicator={false}>
        <View style={localStyles.header}>
          <View style={{ flex: 1 }}>
            <AppText variant="title">Activity</AppText>
            <AppText variant="body" style={localStyles.subtitle}>Every expense and settlement, in one place.</AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh activity"
            onPress={() => { void refresh(); }}
            style={localStyles.headerButton}
          >
            <Ionicons name="refresh-outline" size={21} color={colors.primary} />
          </Pressable>
        </View>

        <View style={localStyles.summary}>
          <GlassPanel padding={spacing.md} style={localStyles.summaryCard}>
            <View style={localStyles.summaryIcon}><Ionicons name="receipt-outline" size={18} color={colors.primary} /></View>
            <AppText style={localStyles.summaryNumber}>{expenseCount}</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted }}>Expenses</AppText>
          </GlassPanel>
          <GlassPanel padding={spacing.md} style={localStyles.summaryCard}>
            <View style={localStyles.summaryIcon}><Ionicons name="swap-horizontal-outline" size={18} color={colors.success} /></View>
            <AppText style={localStyles.summaryNumber}>{settlementCount}</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted }}>Settlements</AppText>
          </GlassPanel>
        </View>

        {loading ? (
          <GlassPanel><LoadingState message="Gathering your latest activity…" /></GlassPanel>
        ) : error ? (
          <GlassPanel>
            <ErrorState message={error} />
            <Pressable accessibilityRole="button" onPress={() => { void refresh(); }} style={localStyles.errorAction}>
              <AppText variant="caption" style={{ color: colors.primary }}>Try again</AppText>
            </Pressable>
          </GlassPanel>
        ) : items.length === 0 ? (
          <GlassPanel padding={spacing.xl} style={localStyles.emptyCard}>
            <EmptyState
              icon="time-outline"
              title="Your story starts here"
              message="Expenses you add and settlements you record will show up here automatically."
            />
            <View style={{ width: "100%" }}>
              <PrimaryButton title="Add your first expense" onPress={() => router.push("/expenses/new")} />
            </View>
          </GlassPanel>
        ) : (
          sectionOrder.map((section) => {
            const sectionItems = buckets[section];
            if (sectionItems.length === 0) return null;
            return (
              <View key={section} style={localStyles.section}>
                <AppText variant="h2" style={localStyles.sectionTitle}>{section}</AppText>
                <GlassPanel padding={spacing.md} style={localStyles.timeline}>
                  {sectionItems.map((item, index) => (
                    <View key={item.id} style={localStyles.timelineRow}>
                      <ActivityRow
                        item={item}
                        onPress={() => {
                          if (item.groupId) router.push(("/groups/" + item.groupId) as any);
                        }}
                      />
                      <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingBottom: spacing.xs }}>
                        <AppText variant="caption" style={{ color: colors.textMuted }}>
                          {formatActivityTime(item.timestamp, section)}
                        </AppText>
                      </View>
                      {index < sectionItems.length - 1 ? <View style={localStyles.separator} /> : null}
                    </View>
                  ))}
                </GlassPanel>
              </View>
            );
          })
        )}

        <AppText variant="caption" style={localStyles.note}>
          Activity is synced from your DeepPay groups, expenses and confirmed or pending settlements.
        </AppText>
      </ScrollView>

      <BottomTabBar activeTab="activity" onTabPress={goTo} onAddPress={() => setSheetVisible(true)} />
      <CreateActionSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activityRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  activityIcon: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  activityCopy: { flex: 1, gap: 3 },
  activityAmount: { alignItems: "flex-end", gap: 3 },
});
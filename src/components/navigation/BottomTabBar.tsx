import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/src/components/common/AppText";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

export type TabKey = "home" | "groups" | "activity" | "profile";
type Props = { activeTab: TabKey; onTabPress: (tab: TabKey) => void; onAddPress: () => void; };
const tabs: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "home", label: "Home", icon: "home-outline" },
  { key: "groups", label: "Groups", icon: "people-outline" },
  { key: "activity", label: "Activity", icon: "time-outline" },
  { key: "profile", label: "Profile", icon: "person-outline" },
];

export function BottomTabBar({ activeTab, onTabPress, onAddPress }: Props) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    bar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 78, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
    tab: { width: 72, alignItems: "center", gap: 3, paddingVertical: spacing.sm },
    add: { width: 54, height: 54, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: -24, borderWidth: 4, borderColor: colors.background },
    pressed: { opacity: 0.7 },
  });
  return <View style={styles.bar}>
    {tabs.slice(0, 2).map((tab) => <TabButton key={tab.key} tab={tab} active={activeTab === tab.key} onPress={() => onTabPress(tab.key)} colors={colors} styles={styles} />)}
    <Pressable accessibilityRole="button" accessibilityLabel="Create" onPress={onAddPress} style={({ pressed }) => [styles.add, pressed ? styles.pressed : null]}><Ionicons name="add" size={28} color={colors.white} /></Pressable>
    {tabs.slice(2).map((tab) => <TabButton key={tab.key} tab={tab} active={activeTab === tab.key} onPress={() => onTabPress(tab.key)} colors={colors} styles={styles} />)}
  </View>;
}

function TabButton({ tab, active, onPress, colors, styles }: { tab: (typeof tabs)[number]; active: boolean; onPress: () => void; colors: ReturnType<typeof useTheme>["colors"]; styles: ReturnType<typeof StyleSheet.create> }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={tab.label} onPress={onPress} style={styles.tab}>
    <Ionicons name={active ? tab.icon.replace("-outline", "") as keyof typeof Ionicons.glyphMap : tab.icon} size={21} color={active ? colors.primary : colors.textMuted} />
    <AppText variant="caption" style={{ color: active ? colors.primary : colors.textMuted }}>{tab.label}</AppText>
  </Pressable>;
}

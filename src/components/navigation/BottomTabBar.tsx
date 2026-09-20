import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@/src/theme/tokens";
import { navigationItems } from "@/src/constants/navigation";

export type TabKey = "home" | "groups" | "activity" | "profile";

type Props = { activeTab: TabKey; onTabPress: (tab: TabKey) => void; onAddPress: () => void };

export function BottomTabBar({ activeTab, onTabPress, onAddPress }: Props) {
  return <View style={styles.bar}>
    <TabButton item={navigationItems[0]} active={activeTab === "home"} onPress={() => onTabPress("home")} />
    <TabButton item={navigationItems[1]} active={activeTab === "groups"} onPress={() => onTabPress("groups")} />
    <Pressable accessibilityRole="button" accessibilityLabel="Create or add" onPress={onAddPress} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}><Ionicons name="add" size={28} color={colors.white} /></Pressable>
    <TabButton item={navigationItems[2]} active={activeTab === "activity"} onPress={() => onTabPress("activity")} />
    <TabButton item={navigationItems[3]} active={activeTab === "profile"} onPress={() => onTabPress("profile")} />
  </View>;
}
function TabButton({ item, active, onPress }: { item: typeof navigationItems[number]; active: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
    <Ionicons name={(active ? item.activeIcon : item.icon) as keyof typeof Ionicons.glyphMap} size={22} color={active ? colors.primary : colors.textMuted} />
  </Pressable>;
}
const styles = StyleSheet.create({
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, height: 76, paddingHorizontal: spacing.md, paddingBottom: 8, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 52, minWidth: 52 },
  addButton: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginHorizontal: spacing.sm, marginTop: -24, borderWidth: 4, borderColor: colors.background, elevation: 5 },
  pressed: { opacity: 0.65 }
});
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/src/components/common/AppText";
import { colors, radius, spacing } from "@/src/theme/tokens";

type Tab = "home" | "groups" | "activity" | "profile";

type Props = {
  activeTab: Tab;
  onTabPress: (tab: Tab) => void;
  onAddPress: () => void;
};

const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "home", label: "Home", icon: "home-outline" },
  { key: "groups", label: "Groups", icon: "people-outline" },
  { key: "activity", label: "Activity", icon: "time-outline" },
  { key: "profile", label: "Profile", icon: "person-outline" },
];

export function BottomTabBar({ activeTab, onTabPress, onAddPress }: Props) {
  return (
    <View style={styles.bar}>
      {tabs.slice(0, 2).map((tab) => (
        <TabButton key={tab.key} tab={tab} active={activeTab === tab.key} onPress={() => onTabPress(tab.key)} />
      ))}
      <Pressable accessibilityRole="button" accessibilityLabel="Create" onPress={onAddPress} style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
      {tabs.slice(2).map((tab) => (
        <TabButton key={tab.key} tab={tab} active={activeTab === tab.key} onPress={() => onTabPress(tab.key)} />
      ))}
    </View>
  );
}

function TabButton({ tab, active, onPress }: { tab: (typeof tabs)[number]; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={tab.label} onPress={onPress} style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
      <Ionicons name={active ? tab.icon.replace("-outline", "") as keyof typeof Ionicons.glyphMap : tab.icon} size={21} color={active ? colors.primary : colors.textMuted} />
      <AppText variant="caption" style={{ color: active ? colors.primary : colors.textMuted }}>{tab.label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 78, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  tab: { width: 72, alignItems: "center", gap: 3, paddingVertical: spacing.sm },
  add: { width: 54, height: 54, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: -24, borderWidth: 4, borderColor: colors.background },
  pressed: { opacity: 0.7 },
});

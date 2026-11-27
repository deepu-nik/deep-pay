import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/src/components/common/AppText";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

export type TabKey = "home" | "groups" | "activity" | "profile";
type Props = { activeTab: TabKey; onTabPress: (tab: TabKey) => void; onAddPress: () => void };
const tabs: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "home", label: "Home", icon: "home-outline" },
  { key: "groups", label: "Groups", icon: "people-outline" },
  { key: "activity", label: "Activity", icon: "time-outline" },
  { key: "profile", label: "Profile", icon: "person-outline" },
];

export function BottomTabBar({ activeTab, onTabPress, onAddPress }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    bar: {
      position: "absolute",
      bottom: Math.max(10, insets.bottom ? insets.bottom - 3 : 10),
      left: spacing.md,
      right: spacing.md,
      height: 76,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 30,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      shadowColor: "#100B20",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 18,
      elevation: 12,
    },
    tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: spacing.sm },
    tabIcon: { width: 42, height: 34, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    tabActive: { backgroundColor: colors.iconBackground },
    add: {
      width: 56,
      height: 56,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      marginTop: -25,
      borderWidth: 4,
      borderColor: colors.background,
      overflow: "hidden",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 9,
      elevation: 7,
    },
    pressed: { opacity: 0.78, transform: [{ scale: 0.96 }] },
  });

  return (
    <View style={styles.bar}>
      {tabs.slice(0, 2).map((tab) => (
        <TabButton key={tab.key} tab={tab} active={activeTab === tab.key} onPress={() => onTabPress(tab.key)} colors={colors} styles={styles} />
      ))}
      <Pressable accessibilityRole="button" accessibilityLabel="Create" onPress={onAddPress} style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
        <LinearGradient colors={colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center", borderRadius: radius.pill }}>
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>
      {tabs.slice(2).map((tab) => (
        <TabButton key={tab.key} tab={tab} active={activeTab === tab.key} onPress={() => onTabPress(tab.key)} colors={colors} styles={styles} />
      ))}
    </View>
  );
}

function TabButton({ tab, active, onPress, colors, styles }: {
  tab: (typeof tabs)[number];
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
  styles: ReturnType<typeof StyleSheet.create>;
}) {
  const iconName = active ? tab.icon.replace("-outline", "") as keyof typeof Ionicons.glyphMap : tab.icon;

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={tab.label} accessibilityState={{ selected: active }} onPress={onPress} style={styles.tab}>
      <View style={[styles.tabIcon, active && styles.tabActive]}>
        <Ionicons name={iconName} size={21} color={active ? colors.primary : colors.textMuted} />
      </View>
      <AppText variant="caption" style={{ color: active ? colors.primary : colors.textMuted, fontWeight: active ? "800" : "600" }}>
        {tab.label}
      </AppText>
    </Pressable>
  );
}

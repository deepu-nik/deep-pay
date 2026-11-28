import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/src/components/common/AppText";
import { useTheme } from "@/src/theme";
import { spacing } from "@/src/theme/tokens";

export type TabKey = "home" | "groups" | "activity" | "profile";
type Props = { activeTab: TabKey; onTabPress: (tab: TabKey) => void; onPayPress: () => void };
const tabs: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "home", label: "Home", icon: "home-outline" },
  { key: "groups", label: "Groups", icon: "people-outline" },
  { key: "activity", label: "Activity", icon: "time-outline" },
  { key: "profile", label: "Profile", icon: "person-outline" },
];

export function BottomTabBar({ activeTab, onTabPress, onPayPress }: Props) {
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
      backgroundColor: colors.glassGradient[0],
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: 30,
      overflow: "hidden",
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
    pay: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: spacing.sm },
    payIcon: {
      width: 42,
      height: 34,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      backgroundColor: colors.iconBackground,
    },
    pressed: { opacity: 0.78, transform: [{ scale: 0.96 }] },
  });

  return (
    <View style={styles.bar}>
      <LinearGradient
        pointerEvents="none"
        colors={colors.glassGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 24, right: 24, height: 1, backgroundColor: colors.glassHighlight }} />
      {tabs.slice(0, 2).map((tab) => (
        <TabButton key={tab.key} tab={tab} active={activeTab === tab.key} onPress={() => onTabPress(tab.key)} colors={colors} styles={styles} />
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Pay"
        onPress={onPayPress}
        style={({ pressed }) => [styles.pay, pressed && styles.pressed]}
      >
        <LinearGradient colors={colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.payIcon}>
          <Ionicons name="wallet-outline" size={21} color="#FFFFFF" />
        </LinearGradient>
        <AppText variant="caption" style={{ color: colors.primary, fontWeight: "800" }}>Pay</AppText>
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
    <Pressable accessibilityRole="button" accessibilityLabel={tab.label} accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
      <View style={[styles.tabIcon, active && styles.tabActive]}>
        <Ionicons name={iconName} size={21} color={active ? colors.primary : colors.textMuted} />
      </View>
      <AppText variant="caption" style={{ color: active ? colors.primary : colors.textMuted, fontWeight: active ? "800" : "600" }}>
        {tab.label}
      </AppText>
    </Pressable>
  );
}

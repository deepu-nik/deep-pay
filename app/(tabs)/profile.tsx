import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { BottomTabBar, type TabKey } from "@/src/components/navigation/BottomTabBar";
import { useTheme, type ThemeMode } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

const modes: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "system", label: "System", icon: "phone-portrait-outline" },
  { key: "light", label: "Light", icon: "sunny-outline" },
  { key: "dark", label: "Dark", icon: "moon-outline" },
];

export default function ProfileScreen() {
  const { colors, mode, setMode } = useTheme();
  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: 110 },
    header: { marginBottom: spacing.xl },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
    option: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    optionLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    selected: { color: colors.primary },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
    radioSelected: { borderColor: colors.primary },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  });
  const goTo = (tab: TabKey) => {
    // Profile owns the theme controls; navigation is handled by the tab bar.
  };
  return <SafeAreaView style={styles.safe} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><View style={styles.avatar}><AppText variant="h2">DS</AppText></View><AppText variant="title">Profile</AppText><AppText variant="body" style={{ color: colors.textMuted }}>Account, preferences and app settings.</AppText></View>
      <View style={styles.card}>
        <View style={styles.titleRow}><Ionicons name="color-palette-outline" size={22} color={colors.primary} /><AppText variant="h2">Appearance</AppText></View>
        {modes.map((item) => <Pressable key={item.key} accessibilityRole="radio" accessibilityState={{ selected: mode === item.key }} onPress={() => setMode(item.key)} style={styles.option}>
          <View style={styles.optionLeft}><Ionicons name={item.icon} size={20} color={mode === item.key ? colors.primary : colors.textMuted} /><AppText variant="bodyMedium" style={mode === item.key ? styles.selected : undefined}>{item.label}</AppText></View>
          <View style={[styles.radio, mode === item.key && styles.radioSelected]}>{mode === item.key && <View style={styles.dot} />}</View>
        </Pressable>)}
      </View>
    </ScrollView>
    <BottomTabBar activeTab="profile" onTabPress={goTo} onAddPress={() => {}} />
  </SafeAreaView>;
}

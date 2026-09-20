import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppText } from "@/src/components/common/AppText";
import { BottomTabBar, type TabKey } from "@/src/components/navigation/BottomTabBar";
import { CreateActionSheet } from "@/src/components/navigation/CreateActionSheet";
import { useTheme } from "@/src/theme";
import { spacing } from "@/src/theme/tokens";

export function PlaceholderScreen({ icon, title, description, activeTab }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string; activeTab: TabKey }) {
  const router = useRouter();
  const { colors } = useTheme();
  const [sheetVisible, setSheetVisible] = useState(false);
  const goTo = (tab: TabKey) => {
    if (tab === activeTab) return;
    router.replace(tab === "home" ? "/(tabs)" : `/(tabs)/${tab}`);
  };
  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl, paddingBottom: 100, gap: spacing.md },
    icon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
    description: { color: colors.textMuted, textAlign: "center", maxWidth: 310 },
    phase: { color: colors.primary, marginTop: spacing.sm },
  });
  return <View style={styles.screen}>
    <View style={styles.container}><View style={styles.icon}><Ionicons name={icon} size={30} color={colors.primary} /></View><AppText variant="h2">{title}</AppText><AppText variant="body" style={styles.description}>{description}</AppText><AppText variant="caption" style={styles.phase}>Coming in the next build phase</AppText></View>
    <BottomTabBar activeTab={activeTab} onTabPress={goTo} onAddPress={() => setSheetVisible(true)} />
    <CreateActionSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
  </View>;
}

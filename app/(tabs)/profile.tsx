import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { BottomTabBar, type TabKey } from "@/src/components/navigation/BottomTabBar";
import { CreateActionSheet } from "@/src/components/navigation/CreateActionSheet";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme, type ThemeMode } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

const modes: {
  key: ThemeMode;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  preview: string;
}[] = [
  { key: "system", label: "System", description: "Follow your device appearance", icon: "phone-portrait-outline", preview: "#A8A2B5" },
  { key: "light", label: "Light", description: "Clean, bright and minimal", icon: "sunny-outline", preview: "#FFFFFF" },
  { key: "dark", label: "Dark", description: "Easy on the eyes at night", icon: "moon-outline", preview: "#211A33" },
  { key: "snap", label: "Snap Yellow", description: "Bold yellow, black and white", icon: "flash", preview: "#FFFC00" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, mode, setMode } = useTheme();
  const { user, signOut } = useAuth();
  const [sheetVisible, setSheetVisible] = useState(false);

  const goTo = (tab: TabKey) => {
    if (tab === "profile") return;
    router.replace(tab === "home" ? "/(tabs)" : `/(tabs)/${tab}`);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth/welcome");
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: 140 },
    header: { marginBottom: spacing.xl },
    avatar: { width: 60, height: 60, borderRadius: 22, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
    card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.lg },
    titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
    option: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    optionLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 },
    optionIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" },
    optionCopy: { flex: 1, gap: 2 },
    selected: { color: colors.primary },
    preview: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
    radioSelected: { borderColor: colors.primary },
    dot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.primary },
    snapNote: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, flexDirection: "row", alignItems: "center", gap: spacing.sm },
    accountRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    accountAvatar: { width: 56, height: 56, borderRadius: 20, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center" },
    accountCopy: { flex: 1, gap: 3 },
    accountAction: { minHeight: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center" },
    signOut: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: spacing.md, paddingVertical: spacing.md },
  });

  const initials = (user?.fullName ?? "D").trim().slice(0, 1).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}><Ionicons name="person" size={27} color={colors.primary} /></View>
          <AppText variant="title">Profile</AppText>
          <AppText variant="body" style={{ color: colors.textMuted }}>Your account, preferences and app settings.</AppText>
        </View>

        <View style={styles.card}>
          <View style={styles.accountRow}>
            <View style={styles.accountAvatar}><AppText variant="h2" style={{ color: colors.primary }}>{initials}</AppText></View>
            <View style={styles.accountCopy}>
              <AppText variant="bodyMedium" numberOfLines={1}>{user?.fullName ?? "DeepPay user"}</AppText>
              <AppText variant="caption" style={{ color: colors.textMuted }} numberOfLines={1}>{user?.email ?? "No local profile"}</AppText>
              <AppText variant="caption" style={{ color: colors.textMuted }}>Local demo profile</AppText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Edit profile" onPress={() => router.push("/profile/edit")} style={styles.accountAction}>
              <AppText variant="caption" style={{ color: colors.primary }}>Edit</AppText>
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={() => void handleSignOut()} style={styles.signOut}>
            <Ionicons name="log-out-outline" size={19} color={colors.danger} />
            <AppText variant="bodyMedium" style={{ color: colors.danger }}>Sign out</AppText>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Ionicons name="color-palette" size={23} color={colors.primary} />
            <AppText variant="h2">Choose your vibe</AppText>
          </View>
          {modes.map((item) => {
            const selected = mode === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="radio"
                accessibilityLabel={`${item.label} theme`}
                accessibilityState={{ selected }}
                onPress={() => setMode(item.key)}
                style={styles.option}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.optionIcon, selected && { backgroundColor: colors.iconBackground }]}>
                    <Ionicons name={item.icon} size={21} color={selected ? colors.primary : colors.textMuted} />
                  </View>
                  <View style={styles.optionCopy}>
                    <AppText variant="bodyMedium" style={selected ? styles.selected : undefined}>{item.label}</AppText>
                    <AppText variant="caption" style={{ color: colors.textMuted }}>{item.description}</AppText>
                  </View>
                </View>
                <View style={[styles.preview, { backgroundColor: item.preview }]} />
                <View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.dot} />}</View>
              </Pressable>
            );
          })}
          <View style={styles.snapNote}>
            <Ionicons name="flash" size={18} color={colors.primary} />
            <AppText variant="caption" style={{ color: colors.textMuted, flex: 1 }}>
              Snap Yellow is a DeepPay-inspired preset with a bold yellow accent, dark actions and bright surfaces.
            </AppText>
          </View>
        </View>
      </ScrollView>

      <BottomTabBar activeTab="profile" onTabPress={goTo} onAddPress={() => setSheetVisible(true)} />
      <CreateActionSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </SafeAreaView>
  );
}

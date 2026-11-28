import { useCallback, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { GlassPanel } from "@/src/components/common/GlassPanel";
import { BottomTabBar, type TabKey } from "@/src/components/navigation/BottomTabBar";
import { useAuth } from "@/src/context/AuthContext";
import { useHomeData } from "@/src/hooks/useHomeData";
import { useTheme, type ThemeMode } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

const modes: {
  key: ThemeMode;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  preview: string;
}[] = [
  { key: "system", label: "System", description: "Follow your device appearance", icon: "phone-portrait-outline", preview: "#888296" },
  { key: "light", label: "Light", description: "Soft surfaces and a bright canvas", icon: "sunny-outline", preview: "#FFFFFF" },
  { key: "dark", label: "Dark", description: "Deep tones with a violet glow", icon: "moon-outline", preview: "#211A33" },
  { key: "snap", label: "Snap Yellow", description: "High contrast with a vivid yellow accent", icon: "flash", preview: "#FFFC00" },
];

function formatCount(value: number) {
  return value.toLocaleString("en-IN");
}

const settingRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 72,
    paddingVertical: spacing.sm,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});

function ProfileSettingRow({
  icon,
  title,
  description,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value?: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [
      settingRowStyles.row,
      pressed && { opacity: 0.72 },
    ]}>
      <View style={[settingRowStyles.icon, { backgroundColor: colors.iconBackground }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={settingRowStyles.copy}>
        <AppText variant="bodyMedium">{title}</AppText>
        <AppText variant="caption" style={{ color: colors.textMuted }}>{description}</AppText>
      </View>
      {value ? <AppText variant="caption" style={{ color: colors.primary }}>{value}</AppText> : null}
      <Ionicons name="chevron-forward" size={19} color={colors.textMuted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, mode, setMode } = useTheme();
  const { user, signOut, resetPassword } = useAuth();
  const { expenses, groups, refresh } = useHomeData();
  const [themeVisible, setThemeVisible] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));

  const currentTheme = modes.find((item) => item.key === mode) ?? modes[0]!;
  const initials = (user?.fullName ?? "D").trim().slice(0, 1).toUpperCase() || "D";

  const goTo = (tab: TabKey) => {
    if (tab === "profile") return;
    router.replace(tab === "home" ? "/(tabs)" : ("/(tabs)/" + tab) as Href);
  };

  const handleSignOut = () => {
    Alert.alert("Sign out of DeepPay?", "You can sign back in at any time.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await signOut();
              router.replace("/auth/welcome" as Href);
            } catch {
              Alert.alert("Couldn't sign out", "Please try again.");
            }
          })();
        },
      },
    ]);
  };

  const handlePasswordReset = async () => {
    if (!user?.email || resettingPassword) return;
    setResettingPassword(true);
    try {
      await resetPassword(user.email);
      Alert.alert("Check your inbox", "A password reset link has been sent to " + user.email + ".");
    } catch (error) {
      Alert.alert(
        "Couldn't send reset email",
        error instanceof Error ? error.message : "Please try again in a moment.",
      );
    } finally {
      setResettingPassword(false);
    }
  };

  const stylesLocal = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: 150, gap: spacing.lg },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs },
    heading: { flex: 1, gap: 3 },
    headerButton: { width: 48, height: 48, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassGradient[0] },
    hero: { marginBottom: spacing.xs },
    heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    avatar: { width: 72, height: 72, borderRadius: 25, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: colors.glassBorder },
    identity: { flex: 1, gap: 3 },
    name: { fontSize: 21, lineHeight: 27, fontWeight: "800", letterSpacing: -0.35 },
    email: { color: colors.textMuted },
    connected: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
    editButton: { minHeight: 42, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.glassBorder, alignItems: "center", justifyContent: "center" },
    heroDivider: { height: 1, backgroundColor: colors.glassBorder, marginVertical: spacing.lg },
    heroBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    heroHint: { flex: 1, color: colors.textMuted, marginRight: spacing.sm },
    heroAction: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingVertical: spacing.xs },
    stats: { flexDirection: "row", gap: spacing.md },
    stat: { flex: 1 },
    statTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
    statIcon: { width: 36, height: 36, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: colors.iconBackground },
    statValue: { fontSize: 25, lineHeight: 30, fontWeight: "800" },
    sectionTitle: { marginHorizontal: 3, marginBottom: spacing.xs },
    settingGroup: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
    settingRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 72, paddingVertical: spacing.sm },
    settingIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" },
    settingCopy: { flex: 1, gap: 2 },
    separator: { height: 1, backgroundColor: colors.glassBorder, marginLeft: 58 },
    signOut: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, minHeight: 54 },
    footer: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xs },
    modalRoot: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(5, 4, 12, 0.48)" },
    scrim: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
    themeSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: colors.glassBorder, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.lg },
    handle: { width: 42, height: 5, borderRadius: 4, alignSelf: "center", backgroundColor: colors.textMuted, opacity: 0.35 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    themeList: { gap: spacing.sm },
    themeOption: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radius.lg, backgroundColor: colors.glassGradient[0] },
    themeSwatch: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.glassBorder },
    themeCopy: { flex: 1, gap: 2 },
    radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.glassBorder, alignItems: "center", justifyContent: "center" },
    radioActive: { borderColor: colors.primary },
    radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
    modalNote: { color: colors.textMuted, lineHeight: 20 },
  });

  return (
    <SafeAreaView style={stylesLocal.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={stylesLocal.content} showsVerticalScrollIndicator={false}>
        <View style={stylesLocal.header}>
          <View style={stylesLocal.heading}>
            <AppText variant="title">Profile</AppText>
            <AppText variant="body" style={{ color: colors.textMuted }}>Your account, your settings, your DeepPay.</AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open appearance settings"
            onPress={() => setThemeVisible(true)}
            style={stylesLocal.headerButton}
          >
            <Ionicons name="settings-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>

        <GlassPanel padding={spacing.lg} style={stylesLocal.hero}>
          <View style={stylesLocal.heroRow}>
            <View style={stylesLocal.avatar}>
              <LinearGradient colors={colors.gradientPrimary} style={StyleSheet.absoluteFill} />
              <AppText variant="h2" style={{ color: colors.onAccent, fontSize: 28 }}>{initials}</AppText>
            </View>
            <View style={stylesLocal.identity}>
              <AppText style={stylesLocal.name} numberOfLines={1}>{user?.fullName ?? "DeepPay member"}</AppText>
              <AppText variant="caption" style={stylesLocal.email} numberOfLines={1}>{user?.email ?? "No email available"}</AppText>
              <View style={stylesLocal.connected}>
                <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                <AppText variant="caption" style={{ color: colors.success }}>Firebase account connected</AppText>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/profile/edit" as Href)}
              style={stylesLocal.editButton}
            >
              <AppText variant="caption" style={{ color: colors.primary }}>Edit</AppText>
            </Pressable>
          </View>
          <View style={stylesLocal.heroDivider} />
          <View style={stylesLocal.heroBottom}>
            <AppText variant="caption" style={stylesLocal.heroHint}>Keep your account details up to date.</AppText>
            <Pressable accessibilityRole="button" onPress={handleSignOut} style={stylesLocal.heroAction}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <AppText variant="caption" style={{ color: colors.danger }}>Sign out</AppText>
            </Pressable>
          </View>
        </GlassPanel>

        <View style={stylesLocal.stats}>
          <GlassPanel padding={spacing.md} style={stylesLocal.stat}>
            <View style={stylesLocal.statTop}>
              <View style={stylesLocal.statIcon}><Ionicons name="receipt-outline" size={18} color={colors.primary} /></View>
              <Ionicons name="trending-up-outline" size={17} color={colors.success} />
            </View>
            <AppText style={stylesLocal.statValue}>{formatCount(expenses.length)}</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted }}>Expenses tracked</AppText>
          </GlassPanel>
          <GlassPanel padding={spacing.md} style={stylesLocal.stat}>
            <View style={stylesLocal.statTop}>
              <View style={stylesLocal.statIcon}><Ionicons name="people-outline" size={18} color={colors.primary} /></View>
              <Ionicons name="layers-outline" size={17} color={colors.success} />
            </View>
            <AppText style={stylesLocal.statValue}>{formatCount(groups.length)}</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted }}>Your groups</AppText>
          </GlassPanel>
        </View>

        <View>
          <AppText variant="h2" style={stylesLocal.sectionTitle}>Account</AppText>
          <GlassPanel padding={spacing.md} style={stylesLocal.settingGroup}>
            <ProfileSettingRow
              icon="qr-code-outline"
              title="UPI & QR"
              description="Manage your UPI ID, receive QR and payment records"
              onPress={() => router.push("/upi" as Href)}
            />
            <View style={stylesLocal.separator} />
            <ProfileSettingRow
              icon="people-outline"
              title="Friends"
              description="Find people, accept requests and manage your friends"
              onPress={() => router.push("/friends" as Href)}
            />
            <View style={stylesLocal.separator} />
            <ProfileSettingRow
              icon="person-circle-outline"
              title="Personal information"
              description="Name and account email"
              onPress={() => router.push("/profile/edit" as Href)}
            />
            <View style={stylesLocal.separator} />
            <ProfileSettingRow
              icon="lock-closed-outline"
              title={resettingPassword ? "Sending reset link…" : "Password & security"}
              description="Send a password reset link to your email"
              onPress={() => { void handlePasswordReset(); }}
            />
          </GlassPanel>
        </View>

        <View>
          <AppText variant="h2" style={stylesLocal.sectionTitle}>Preferences</AppText>
          <GlassPanel padding={spacing.md} style={stylesLocal.settingGroup}>
            <ProfileSettingRow
              icon="color-palette-outline"
              title="Appearance"
              description="Personalize the look and feel of DeepPay"
              value={currentTheme.label}
              onPress={() => setThemeVisible(true)}
            />
          </GlassPanel>
        </View>

        <View>
          <AppText variant="h2" style={stylesLocal.sectionTitle}>About</AppText>
          <GlassPanel padding={spacing.md} style={stylesLocal.settingGroup}>
            <View style={stylesLocal.settingRow}>
              <View style={[stylesLocal.settingIcon, { backgroundColor: colors.iconBackground }]}>
                <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
              </View>
              <View style={stylesLocal.settingCopy}>
                <AppText variant="bodyMedium">DeepPay</AppText>
                <AppText variant="caption" style={{ color: colors.textMuted }}>Your money, in the loop.</AppText>
              </View>
              <AppText variant="caption" style={{ color: colors.textMuted }}>v0.1.0</AppText>
            </View>
          </GlassPanel>
        </View>
        <AppText variant="caption" style={stylesLocal.footer}>Made to make shared money feel simple.</AppText>
      </ScrollView>

      <BottomTabBar activeTab="profile" onTabPress={goTo} onPayPress={() => router.push("/upi" as Href)} />

      <Modal visible={themeVisible} transparent animationType="slide" onRequestClose={() => setThemeVisible(false)}>
        <View style={stylesLocal.modalRoot}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close appearance settings" style={stylesLocal.scrim} onPress={() => setThemeVisible(false)} />
          <View style={stylesLocal.themeSheet}>
            <View style={stylesLocal.handle} />
            <View style={stylesLocal.modalHeader}>
              <View>
                <AppText variant="h2">Appearance</AppText>
                <AppText variant="caption" style={{ color: colors.textMuted }}>Choose the DeepPay look you love.</AppText>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setThemeVisible(false)} style={stylesLocal.headerButton}>
                <Ionicons name="close" size={21} color={colors.text} />
              </Pressable>
            </View>
            <View style={stylesLocal.themeList}>
              {modes.map((item) => {
                const selected = mode === item.key;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="radio"
                    accessibilityLabel={item.label + " theme"}
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setMode(item.key);
                      setThemeVisible(false);
                    }}
                    style={[
                      stylesLocal.themeOption,
                      selected && { borderColor: colors.primary, backgroundColor: colors.iconBackground },
                    ]}
                  >
                    <View style={[stylesLocal.themeSwatch, { backgroundColor: item.preview }]}>
                      <Ionicons name={item.icon} size={21} color={item.key === "snap" ? "#111111" : item.key === "light" ? "#704CFF" : "#FFFFFF"} />
                    </View>
                    <View style={stylesLocal.themeCopy}>
                      <AppText variant="bodyMedium" style={selected ? { color: colors.primary } : undefined}>{item.label}</AppText>
                      <AppText variant="caption" style={{ color: colors.textMuted }}>{item.description}</AppText>
                    </View>
                    <View style={[stylesLocal.radio, selected && stylesLocal.radioActive]}>
                      {selected ? <View style={stylesLocal.radioDot} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <AppText variant="caption" style={stylesLocal.modalNote}>
              Your choice is saved on this device. System mode follows your phone's appearance setting.
            </AppText>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
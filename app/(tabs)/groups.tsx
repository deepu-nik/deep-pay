import { useCallback, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { GlassPanel } from "@/src/components/common/GlassPanel";
import { BottomTabBar } from "@/src/components/navigation/BottomTabBar";
import { EmptyState } from "@/src/components/common/EmptyState";
import { LoadingState } from "@/src/components/common/LoadingState";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { useGroups } from "@/src/hooks/useGroups";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

type GroupsSection = "groups" | "friends";

export default function GroupsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { groups, loading, error, refresh, createGroup } = useGroups();
  const [activeSection, setActiveSection] = useState<GroupsSection>("groups");
  const [editorVisible, setEditorVisible] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    void refresh().catch(() => undefined);
  }, [refresh]));

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: 130, gap: spacing.lg },
    header: { gap: spacing.xs, marginBottom: spacing.xs },
    muted: { color: colors.textMuted, lineHeight: 20 },
    tabs: {
      flexDirection: "row",
      padding: 4,
      gap: 4,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.glassGradient[0],
    },
    tab: {
      flex: 1,
      minHeight: 48,
      borderRadius: radius.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    tabActive: { backgroundColor: colors.primary },
    tabText: { color: colors.textMuted, fontWeight: "700" as const },
    tabTextActive: { color: colors.white, fontWeight: "800" as const },
    sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
    count: {
      minWidth: 32,
      height: 28,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.iconBackground,
    },
    card: { marginBottom: spacing.md },
    groupRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    groupIcon: {
      width: 50, height: 50, borderRadius: 18,
      backgroundColor: colors.iconBackground,
      alignItems: "center", justifyContent: "center",
    },
    groupCopy: { flex: 1, gap: 3 },
    friendPanel: { gap: spacing.md },
    friendHero: {
      width: 60, height: 60, borderRadius: 21,
      backgroundColor: colors.iconBackground,
      alignItems: "center", justifyContent: "center",
    },
    modal: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
    sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    sheetContent: { gap: spacing.lg, paddingBottom: spacing.xxl - spacing.lg },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    input: {
      minHeight: 52, borderWidth: 1, borderColor: colors.glassBorder,
      borderRadius: radius.md, paddingHorizontal: spacing.lg,
      color: colors.text, fontSize: 16, backgroundColor: colors.glassGradient[0],
    },
    memberChip: {
      alignSelf: "flex-start", paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      borderRadius: radius.pill, borderWidth: 1, borderColor: colors.primary,
      backgroundColor: colors.iconBackground,
    },
    retry: { alignItems: "center", paddingVertical: spacing.md },
  });

  const openCreate = () => {
    setActiveSection("groups");
    setName("");
    setEditorVisible(true);
  };

  const save = async () => {
    if (!user?.id || name.trim().length < 2 || saving) return;
    setSaving(true);
    try {
      await createGroup({ name: name.trim(), memberIds: [user.id] });
      setActiveSection("groups");
      setEditorVisible(false);
      setName("");
    } catch (cause) {
      Alert.alert("Couldn't create group", cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const goTo = (tab: "home" | "groups" | "activity" | "profile") => {
    if (tab === "groups") return;
    router.push(tab === "home" ? "/(tabs)" : "/(tabs)/" + tab as any);
  };

  const memberCount = (ids: string[]) => ids.length === 1 ? "1 member" : ids.length + " members";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppText variant="title">Groups</AppText>
          <AppText variant="body" style={styles.muted}>Shared plans, expenses and people — all together.</AppText>
        </View>

        <View style={styles.tabs} accessibilityRole="tablist">
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeSection === "groups" }}
            onPress={() => setActiveSection("groups")}
            style={[styles.tab, activeSection === "groups" && styles.tabActive]}
          >
            <Ionicons name="people-outline" size={19} color={activeSection === "groups" ? colors.white : colors.textMuted} />
            <AppText variant="caption" style={activeSection === "groups" ? styles.tabTextActive : styles.tabText}>Groups</AppText>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeSection === "friends" }}
            onPress={() => setActiveSection("friends")}
            style={[styles.tab, activeSection === "friends" && styles.tabActive]}
          >
            <Ionicons name="person-add-outline" size={18} color={activeSection === "friends" ? colors.white : colors.textMuted} />
            <AppText variant="caption" style={activeSection === "friends" ? styles.tabTextActive : styles.tabText}>Add Friends</AppText>
          </Pressable>
        </View>

        {activeSection === "groups" ? (
          <View>
            <View style={styles.sectionHeading}>
              <AppText variant="h2">Your groups</AppText>
              <View style={styles.count}>
                <AppText variant="caption" style={{ color: colors.primary }}>{groups.length}</AppText>
              </View>
            </View>

            <View style={{ marginBottom: spacing.lg }}>
              <PrimaryButton title="＋  Create group" onPress={openCreate} />
            </View>

            {loading ? (
              <GlassPanel padding={spacing.xl}><LoadingState message="Loading your groups…" /></GlassPanel>
            ) : error ? (
              <GlassPanel padding={spacing.lg} gap={spacing.md}>
                <View style={styles.groupRow}>
                  <View style={styles.groupIcon}>
                    <Ionicons name="cloud-offline-outline" size={22} color={colors.warning} />
                  </View>
                  <View style={styles.groupCopy}>
                    <AppText variant="bodyMedium">Couldn't load groups</AppText>
                    <AppText variant="caption" style={styles.muted}>{error}</AppText>
                  </View>
                </View>
                <Pressable accessibilityRole="button" onPress={() => { void refresh().catch(() => undefined); }} style={styles.retry}>
                  <AppText variant="caption" style={{ color: colors.primary, fontWeight: "800" }}>Try again</AppText>
                </Pressable>
              </GlassPanel>
            ) : groups.length ? groups.map((group) => (
              <GlassPanel key={group.id} padding={spacing.lg} style={styles.card}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={"Open " + group.name + ", " + memberCount(group.memberIds)}
                  onPress={() => router.push(("/groups/" + group.id) as any)}
                  style={styles.groupRow}
                >
                  <View style={styles.groupIcon}>
                    <Ionicons name="people-outline" size={23} color={colors.primary} />
                  </View>
                  <View style={styles.groupCopy}>
                    <AppText variant="bodyMedium" numberOfLines={1}>{group.name}</AppText>
                    <AppText variant="caption" style={styles.muted}>{memberCount(group.memberIds)}</AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </Pressable>
              </GlassPanel>
            )) : (
              <GlassPanel padding={spacing.lg}>
                <EmptyState
                  icon="people-outline"
                  title="Your first group starts here"
                  message="Create a space for trips, roommates, clubs or shared bills. You can invite people after creating it."
                />
              </GlassPanel>
            )}
          </View>
        ) : (
          <GlassPanel padding={spacing.lg} style={styles.friendPanel}>
            <View style={styles.friendHero}>
              <Ionicons name="people-outline" size={28} color={colors.primary} />
            </View>
            <AppText variant="h2">Bring your people together</AppText>
            <AppText variant="body" style={styles.muted}>
              Find friends by their DeepPay username, send requests and manage the people you connect with.
            </AppText>
            <PrimaryButton title="Find & add friends" onPress={() => router.push("/friends" as any)} />
            <AppText variant="caption" style={styles.muted}>
              You can invite friends into a group using that group's invite link.
            </AppText>
          </GlassPanel>
        )}
      </ScrollView>

      <BottomTabBar activeTab="groups" onTabPress={goTo} onPayPress={() => router.push("/upi" as any)} />

      <Modal visible={editorVisible} transparent animationType="slide" onRequestClose={() => setEditorVisible(false)}>
        <View style={styles.modal}>
          <GlassPanel padding={spacing.lg} style={styles.sheet}>
            <View style={styles.sheetContent}>
              <View style={styles.modalHeader}>
                <AppText variant="h2">Create group</AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close create group"
                  onPress={() => setEditorVisible(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Goa Trip"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoFocus
                maxLength={60}
                returnKeyType="done"
                onSubmitEditing={() => { void save(); }}
              />
              <View style={styles.memberChip}>
                <AppText variant="caption" style={{ color: colors.primary }}>Owner · You</AppText>
              </View>
              <AppText variant="caption" style={styles.muted}>
                Create the group first, then invite members with its secure invite link.
              </AppText>
              <PrimaryButton title={saving ? "Creating…" : "Create group"} onPress={save} disabled={!name.trim() || name.trim().length < 2 || saving} />
            </View>
          </GlassPanel>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

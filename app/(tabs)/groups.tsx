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

export default function GroupsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { groups, loading, error, refresh, createGroup } = useGroups();
  const [editorVisible, setEditorVisible] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    void refresh().catch(() => undefined);
  }, [refresh]));

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: 110 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xl },
    headerActions: { flexDirection: "row", gap: spacing.sm },
    iconButton: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.glassGradient[0], borderWidth: 1, borderColor: colors.glassBorder, alignItems: "center", justifyContent: "center" },
    card: { marginBottom: spacing.md },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    groupIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center" },
    muted: { color: colors.textMuted },
    modal: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
    sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    sheetContent: { gap: spacing.lg, paddingBottom: spacing.xxl - spacing.lg },
    input: { minHeight: 52, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radius.md, paddingHorizontal: spacing.lg, color: colors.text, fontSize: 16, backgroundColor: colors.glassGradient[0] },
    memberChip: { alignSelf: "flex-start", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.iconBackground },
  });

  const openCreate = () => {
    setName("");
    setEditorVisible(true);
  };

  const save = async () => {
    if (!user?.id || name.trim().length < 2 || saving) return;
    setSaving(true);
    try {
      await createGroup({ name: name.trim(), memberIds: [user.id] });
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
          <View>
            <AppText variant="title">Groups</AppText>
            <AppText variant="body" style={styles.muted}>Shared expenses, kept together.</AppText>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push("/friends" as any)}
              accessibilityRole="button"
              accessibilityLabel="Find and add friends"
              style={styles.iconButton}
            >
              <Ionicons name="person-add-outline" size={21} color={colors.primary} />
            </Pressable>
            <Pressable onPress={openCreate} accessibilityLabel="Create group" style={styles.iconButton}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <GlassPanel padding={spacing.xl}><LoadingState message="Loading groups…" /></GlassPanel>
        ) : error ? (
          <GlassPanel padding={spacing.xl}>
            <AppText variant="body" style={styles.muted}>{error}</AppText>
            <PrimaryButton title="Try again" onPress={() => { void refresh().catch(() => undefined); }} />
          </GlassPanel>
        ) : groups.length ? groups.map((group) => (
          <GlassPanel key={group.id} padding={spacing.lg} style={styles.card}>
            <Pressable onPress={() => router.push(("/groups/" + group.id) as any)} style={styles.row}>
              <View style={styles.groupIcon}><Ionicons name="people-outline" size={23} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMedium">{group.name}</AppText>
                <AppText variant="caption" style={styles.muted}>{memberCount(group.memberIds)}</AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          </GlassPanel>
        )) : (
          <GlassPanel padding={spacing.xl}>
            <EmptyState icon="people-outline" title="No groups yet" message="Create a group for trips, roommates, clubs or projects." />
          </GlassPanel>
        )}
      </ScrollView>

      <BottomTabBar activeTab="groups" onTabPress={goTo} onPayPress={() => router.push("/upi" as any)} />

      <Modal visible={editorVisible} transparent animationType="slide" onRequestClose={() => setEditorVisible(false)}>
        <View style={styles.modal}>
          <GlassPanel padding={spacing.lg} style={styles.sheet}>
            <View style={styles.sheetContent}>
              <View style={styles.header}>
                <AppText variant="h2">Create group</AppText>
                <Pressable onPress={() => setEditorVisible(false)}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
              </View>
              <TextInput value={name} onChangeText={setName} placeholder="e.g. Goa Trip" placeholderTextColor={colors.textMuted} style={styles.input} autoFocus maxLength={60} />
              <AppText variant="bodyMedium">Group owner</AppText>
              <View style={styles.memberChip}><AppText variant="caption" style={{ color: colors.primary }}>You</AppText></View>
              <AppText variant="caption" style={styles.muted}>Create the group first, then use its invite link to add other DeepPay users. Invite links expire after 7 days.</AppText>
              <PrimaryButton title={saving ? "Creating…" : "Create group"} onPress={save} disabled={!name.trim() || name.trim().length < 2 || saving} />
            </View>
          </GlassPanel>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

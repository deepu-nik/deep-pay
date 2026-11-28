import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { GlassPanel } from "@/src/components/common/GlassPanel";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { LoadingState } from "@/src/components/common/LoadingState";
import { useAuth } from "@/src/context/AuthContext";
import { useGroups } from "@/src/hooks/useGroups";
import { useTheme } from "@/src/theme";
import { spacing } from "@/src/theme/tokens";
import type { GroupInviteDetails } from "@/src/services/firebase/groupService";

export default function GroupInviteScreen() {
  const router = useRouter();
  const { inviteId } = useLocalSearchParams<{ inviteId: string }>();
  const { colors } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const { getInviteDetails, joinGroupInvite } = useGroups();
  const [invite, setInvite] = useState<GroupInviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (authLoading) return () => { active = false; };
    if (!user || !inviteId) {
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    getInviteDetails(inviteId)
      .then((details) => { if (active) setInvite(details); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "This invite link is not available.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id, authLoading, inviteId, getInviteDetails]);

  const join = async () => {
    if (!inviteId || joining) return;
    setJoining(true);
    setError(null);
    try {
      const groupId = await joinGroupInvite(inviteId);
      router.replace(("/groups/" + groupId) as any);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't join this group. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: spacing.lg },
    content: { gap: spacing.lg, alignItems: "center" },
    icon: { width: 68, height: 68, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: colors.iconBackground },
    muted: { color: colors.textMuted, textAlign: "center" },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <GlassPanel padding={spacing.xl}>
        <View style={styles.content}>
          <View style={styles.icon}><Ionicons name="people-outline" size={31} color={colors.primary} /></View>
          <AppText variant="title" style={{ textAlign: "center" }}>DeepPay group invitation</AppText>
          {authLoading || loading ? <LoadingState message="Checking invitation…" /> : !user ? (
            <>
              <AppText variant="body" style={styles.muted}>Sign in or create a DeepPay account, then reopen this invitation link to join the group.</AppText>
              <PrimaryButton title="Sign in" onPress={() => router.push("/auth/sign-in" as any)} />
              <Pressable onPress={() => router.push("/auth/sign-up" as any)}>
                <AppText variant="caption" style={{ color: colors.primary }}>Create an account</AppText>
              </Pressable>
            </>
          ) : invite ? (
            <>
              <AppText variant="h2" style={{ textAlign: "center" }}>{invite.groupName}</AppText>
              <AppText variant="body" style={styles.muted}>You've been invited to join this group and share expenses with its members.</AppText>
              <AppText variant="caption" style={styles.muted}>Invite expires {new Date(invite.expiresAt).toLocaleDateString("en-IN")}.</AppText>
              <PrimaryButton title={joining ? "Joining…" : "Join group"} onPress={join} disabled={joining} />
            </>
          ) : (
            <AppText variant="body" style={styles.muted}>{error ?? "This invitation is not available."}</AppText>
          )}
          {error && invite ? <AppText variant="caption" style={{ color: colors.danger, textAlign: "center" }}>{error}</AppText> : null}
          <Pressable onPress={() => router.replace("/(tabs)" as any)}>
            <AppText variant="caption" style={{ color: colors.primary }}>Go to DeepPay</AppText>
          </Pressable>
        </View>
      </GlassPanel>
    </SafeAreaView>
  );
}

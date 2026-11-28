import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { EmptyState } from "@/src/components/common/EmptyState";
import { ErrorState } from "@/src/components/common/ErrorState";
import { GlassPanel } from "@/src/components/common/GlassPanel";
import { LoadingState } from "@/src/components/common/LoadingState";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { useFriends } from "@/src/hooks/useFriends";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

function FriendAvatar({ name }: { name: string }) {
  const { colors } = useTheme();
  return (
    <View style={{
      width: 46,
      height: 46,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.iconBackground,
    }}>
      <AppText variant="h2" style={{ color: colors.primary }}>
        {(name.trim()[0] ?? "D").toUpperCase()}
      </AppText>
    </View>
  );
}

export default function FriendsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    friends,
    handle,
    incomingRequests,
    outgoingRequests,
    loading,
    error,
    refresh,
    claimUsername,
    sendFriendRequest,
    respondToRequest,
  } = useFriends();

  const [usernameDraft, setUsernameDraft] = useState("");
  const [searchUsername, setSearchUsername] = useState("");
  const [savingHandle, setSavingHandle] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const saveHandle = async () => {
    if (savingHandle) return;
    setSavingHandle(true);
    setActionError(null);
    setNotice(null);
    try {
      const saved = await claimUsername(usernameDraft);
      setUsernameDraft("");
      setNotice("Your DeepPay username is @" + saved.username + ". Friends can now find you.");
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "We couldn't save your username. Please try again.");
    } finally {
      setSavingHandle(false);
    }
  };

  const addFriend = async () => {
    if (sendingRequest || !searchUsername.trim()) return;
    setSendingRequest(true);
    setActionError(null);
    setNotice(null);
    try {
      await sendFriendRequest(searchUsername);
      setSearchUsername("");
      setNotice("Friend request sent.");
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "We couldn't send this friend request.");
    } finally {
      setSendingRequest(false);
    }
  };

  const handleResponse = async (requestId: string, accept: boolean) => {
    if (respondingId) return;
    setRespondingId(requestId);
    setActionError(null);
    setNotice(null);
    try {
      await respondToRequest(requestId, accept);
      setNotice(accept ? "Friend request accepted." : "Friend request declined.");
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "We couldn't update this friend request.");
    } finally {
      setRespondingId(null);
    }
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    back: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.glassGradient[0],
      alignItems: "center",
      justifyContent: "center",
    },
    heading: { flex: 1, gap: 2 },
    muted: { color: colors.textMuted, lineHeight: 19 },
    sectionTitle: { marginBottom: 2 },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    copy: { flex: 1, gap: 3 },
    field: { gap: spacing.xs },
    input: {
      minHeight: 52,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      color: colors.text,
      fontSize: 16,
      backgroundColor: colors.glassGradient[0],
    },
    inline: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    prefix: {
      minHeight: 52,
      paddingHorizontal: spacing.md,
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: radius.md,
      backgroundColor: colors.iconBackground,
    },
    requestActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
    secondaryButton: {
      minHeight: 44,
      flex: 1,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.glassGradient[0],
    },
    primarySmall: {
      minHeight: 44,
      flex: 1,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    count: {
      minWidth: 26,
      height: 26,
      borderRadius: 13,
      paddingHorizontal: 7,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.iconBackground,
    },
    alert: { gap: spacing.sm },
    empty: { paddingVertical: spacing.sm },
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={styles.back}
            >
              <Ionicons name="arrow-back" size={21} color={colors.text} />
            </Pressable>
            <View style={styles.heading}>
              <AppText variant="title">Friends</AppText>
              <AppText variant="caption" style={styles.muted}>
                Find people and keep shared expenses together.
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh friends"
              onPress={() => { void refresh(); }}
              style={styles.back}
            >
              <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>

          {loading ? (
            <GlassPanel padding={spacing.xl}>
              <LoadingState message="Checking your friends and requests…" />
            </GlassPanel>
          ) : error ? (
            <GlassPanel padding={spacing.lg} gap={spacing.md}>
              <ErrorState message={error} />
              <PrimaryButton title="Try again" onPress={() => { void refresh(); }} />
            </GlassPanel>
          ) : (
            <>
              <GlassPanel padding={spacing.lg} gap={spacing.md}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="h2">Your username</AppText>
                    <AppText variant="caption" style={styles.muted}>People can find you by this username. Your email stays private.</AppText>
                  </View>
                  <View style={styles.count}>
                    <Ionicons name="at" size={15} color={colors.primary} />
                  </View>
                </View>
                {handle ? (
                  <View style={styles.row}>
                    <FriendAvatar name={handle.displayName} />
                    <View style={styles.copy}>
                      <AppText variant="bodyMedium">{handle.displayName}</AppText>
                      <AppText variant="caption" style={{ color: colors.primary }}>@{handle.username}</AppText>
                    </View>
                    <AppText variant="caption" style={{ color: colors.success }}>Active</AppText>
                  </View>
                ) : (
                  <>
                    <AppText variant="caption" style={styles.muted}>
                      Choose a unique username once. Use 3–20 letters, numbers or underscores.
                    </AppText>
                    <View style={styles.inline}>
                      <View style={styles.prefix}><AppText variant="bodyMedium" style={{ color: colors.primary }}>@</AppText></View>
                      <TextInput
                        value={usernameDraft}
                        onChangeText={(value) => { setUsernameDraft(value.toLowerCase().replace(/[^a-z0-9_]/g, "")); setActionError(null); }}
                        placeholder="your_username"
                        placeholderTextColor={colors.textMuted}
                        style={[styles.input, { flex: 1 }]}
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={20}
                      />
                    </View>
                    <PrimaryButton
                      title={savingHandle ? "Saving username…" : "Set my username"}
                      onPress={() => { void saveHandle(); }}
                      disabled={savingHandle || usernameDraft.trim().length < 3}
                    />
                  </>
                )}
              </GlassPanel>

              {handle ? (
                <GlassPanel padding={spacing.lg} gap={spacing.md}>
                  <View>
                    <AppText variant="h2">Add a friend</AppText>
                    <AppText variant="caption" style={styles.muted}>Search using their exact DeepPay username.</AppText>
                  </View>
                  <View style={styles.inline}>
                    <View style={styles.prefix}><AppText variant="bodyMedium" style={{ color: colors.primary }}>@</AppText></View>
                    <TextInput
                      value={searchUsername}
                      onChangeText={(value) => { setSearchUsername(value.toLowerCase().replace(/[^a-z0-9_]/g, "")); setActionError(null); }}
                      placeholder="friend_username"
                      placeholderTextColor={colors.textMuted}
                      style={[styles.input, { flex: 1 }]}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={20}
                      returnKeyType="send"
                      onSubmitEditing={() => { void addFriend(); }}
                    />
                  </View>
                  <PrimaryButton
                    title={sendingRequest ? "Sending request…" : "Send friend request"}
                    onPress={() => { void addFriend(); }}
                    disabled={sendingRequest || searchUsername.trim().length < 3}
                  />
                </GlassPanel>
              ) : null}

              {actionError ? (
                <GlassPanel padding={spacing.md} style={styles.alert}>
                  <AppText variant="caption" style={{ color: colors.danger }}>{actionError}</AppText>
                </GlassPanel>
              ) : null}
              {notice ? (
                <GlassPanel padding={spacing.md}>
                  <AppText variant="caption" style={{ color: colors.success }}>{notice}</AppText>
                </GlassPanel>
              ) : null}

              <View style={{ gap: spacing.sm }}>
                <View style={styles.row}>
                  <AppText variant="h2" style={styles.sectionTitle}>Friend requests</AppText>
                  <View style={styles.count}>
                    <AppText variant="caption" style={{ color: colors.primary }}>{incomingRequests.length}</AppText>
                  </View>
                </View>
                {incomingRequests.length ? incomingRequests.map((request) => (
                  <GlassPanel key={request.id} padding={spacing.md}>
                    <View style={styles.row}>
                      <FriendAvatar name={request.fromDisplayName} />
                      <View style={styles.copy}>
                        <AppText variant="bodyMedium">{request.fromDisplayName}</AppText>
                        <AppText variant="caption" style={styles.muted}>@{request.fromUsername}</AppText>
                      </View>
                    </View>
                    <View style={styles.requestActions}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={respondingId === request.id}
                        onPress={() => { void handleResponse(request.id, false); }}
                        style={styles.secondaryButton}
                      >
                        <AppText variant="caption" style={{ color: colors.textMuted }}>
                          Decline
                        </AppText>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        disabled={respondingId === request.id}
                        onPress={() => { void handleResponse(request.id, true); }}
                        style={styles.primarySmall}
                      >
                        <AppText variant="caption" style={{ color: "#FFFFFF" }}>
                          {respondingId === request.id ? "Saving…" : "Accept"}
                        </AppText>
                      </Pressable>
                    </View>
                  </GlassPanel>
                )) : (
                  <GlassPanel padding={spacing.md}>
                    <AppText variant="caption" style={styles.muted}>No new friend requests. When someone adds you, it will appear here.</AppText>
                  </GlassPanel>
                )}
              </View>

              <View style={{ gap: spacing.sm }}>
                <AppText variant="h2" style={styles.sectionTitle}>Sent requests</AppText>
                {outgoingRequests.length ? outgoingRequests.map((request) => (
                  <GlassPanel key={request.id} padding={spacing.md}>
                    <View style={styles.row}>
                      <FriendAvatar name={request.toDisplayName} />
                      <View style={styles.copy}>
                        <AppText variant="bodyMedium">{request.toDisplayName}</AppText>
                        <AppText variant="caption" style={styles.muted}>@{request.toUsername}</AppText>
                      </View>
                      <AppText variant="caption" style={{ color: colors.warning }}>Pending</AppText>
                    </View>
                  </GlassPanel>
                )) : (
                  <AppText variant="caption" style={styles.muted}>You have no pending sent requests.</AppText>
                )}
              </View>

              <View style={{ gap: spacing.sm }}>
                <View style={styles.row}>
                  <AppText variant="h2" style={styles.sectionTitle}>Your friends</AppText>
                  <View style={styles.count}>
                    <AppText variant="caption" style={{ color: colors.primary }}>{friends.length}</AppText>
                  </View>
                </View>
                {friends.length ? friends.map((friend) => (
                  <GlassPanel key={friend.id} padding={spacing.md}>
                    <View style={styles.row}>
                      <FriendAvatar name={friend.name} />
                      <View style={styles.copy}>
                        <AppText variant="bodyMedium">{friend.name}</AppText>
                        <AppText variant="caption" style={styles.muted}>@{friend.username}</AppText>
                      </View>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    </View>
                  </GlassPanel>
                )) : (
                  <GlassPanel padding={spacing.md} style={styles.empty}>
                    <EmptyState
                      icon="people-outline"
                      title="Your friend list is empty"
                      message={handle
                        ? "Search for someone's username above to send your first friend request."
                        : "Set your username first, then people can find and add you."}
                    />
                  </GlassPanel>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { EmptyState } from "@/src/components/common/EmptyState";
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
    handleLoading,
    friendsLoading,
    requestsLoading,
    refresh,
    checkFirestoreConnection,
    findUserByUsername,
    sendFriendRequest,
    removeFriend,
    respondToRequest,
  } = useFriends();

  const [searchUsername, setSearchUsername] = useState("");
  const [foundUser, setFoundUser] = useState<{ uid: string; username: string; displayName: string } | null>(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"friends" | "find" | "requests">("friends");

  const findUser = async () => {
    if (searchingUser || !handle || !searchUsername.trim()) return;
    setSearchingUser(true);
    setFoundUser(null);
    setActionError(null);
    setNotice(null);
    try {
      const result = await findUserByUsername(searchUsername);
      setFoundUser(result);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "We couldn't find that DeepPay user.");
    } finally {
      setSearchingUser(false);
    }
  };

  const testFirebaseConnection = async () => {
    if (checkingConnection) return;
    setCheckingConnection(true);
    setConnectionResult(null);
    setActionError(null);
    try {
      const result = await checkFirestoreConnection();
      setConnectionResult(result.profileFound
        ? "Connected to Firebase project " + result.projectId
          + " · Server replied in " + result.elapsedMs + " ms · Account profile found."
        : "Firestore reachable at project " + result.projectId
          + " · Server replied in " + result.elapsedMs + " ms · Account profile missing. Sign out, then sign back in to repair it.",
      );
    } catch (cause) {
      setConnectionResult(cause instanceof Error ? cause.message : "Firestore connection test failed.");
    } finally {
      setCheckingConnection(false);
    }
  };

  const addFriend = async () => {
    if (sendingRequest || !handle || !foundUser) return;
    setSendingRequest(true);
    setActionError(null);
    setNotice(null);
    try {
      await sendFriendRequest(foundUser.username);
      setSearchUsername("");
      setFoundUser(null);
      setNotice("Friend request sent to @" + foundUser.username + ".");
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "We couldn't send this friend request.");
    } finally {
      setSendingRequest(false);
    }
  };

  const confirmRemoveFriend = (friend: { id: string; friendshipId: string; name: string; username: string }) => {
    Alert.alert(
      "Remove friend?",
      "Remove " + friend.name + " (@" + friend.username + ") from your friends? You can send a new request later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (removingFriendId) return;
            setRemovingFriendId(friend.id);
            setActionError(null);
            setNotice(null);
            try {
              await removeFriend(friend.friendshipId);
              setNotice("@" + friend.username + " was removed from your friends.");
            } catch (cause) {
              setActionError(cause instanceof Error ? cause.message : "We couldn't remove this friend.");
            } finally {
              setRemovingFriendId(null);
            }
          },
        },
      ],
    );
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
    inline: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
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
    sectionTabs: {
      flexDirection: "row",
      padding: 4,
      gap: 4,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.glassGradient[0],
    },
    sectionTab: {
      flex: 1,
      minHeight: 46,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xs,
    },
    sectionTabActive: {
      backgroundColor: colors.primary,
    },
    sectionTabText: {
      color: colors.textMuted,
      textAlign: "center",
    },
    sectionTabTextActive: {
      color: "#FFFFFF",
    },
    sectionStack: {
      gap: spacing.sm,
    },
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
                Find people and manage friend requests.
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh friends and requests"
              onPress={() => { void refresh(); }}
              style={styles.back}
            >
              <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>

          <GlassPanel padding={spacing.lg} gap={spacing.md}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppText variant="h2">Your username</AppText>
                <AppText variant="caption" style={styles.muted}>
                  Friends can find you by username. Your email address is never shown.
                </AppText>
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
              <View style={styles.sectionStack}>
                {handleLoading ? (
                  <AppText variant="caption" style={styles.muted}>Checking your account…</AppText>
                ) : (
                  <>
                    <AppText variant="caption" style={styles.muted}>
                      New here? Create your unique @username from Profile first. It lets friends find you without sharing your email.
                    </AppText>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.push("/(tabs)/profile" as any)}
                      style={{ alignSelf: "flex-start", paddingVertical: spacing.xs }}
                    >
                      <AppText variant="caption" style={{ color: colors.primary, fontWeight: "700" }}>Set up username in Profile</AppText>
                    </Pressable>
                  </>
                )}
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={() => { void testFirebaseConnection(); }}
              disabled={checkingConnection}
              style={{ alignSelf: "center", paddingVertical: spacing.xs }}
            >
              <AppText variant="caption" style={{ color: colors.primary }}>
                {checkingConnection ? "Checking Firebase server…" : "Test Firebase connection"}
              </AppText>
            </Pressable>
            {connectionResult ? (
              <AppText variant="caption" style={{ color: connectionResult.startsWith("Connected") ? colors.success : colors.warning }}>
                {connectionResult}
              </AppText>
            ) : null}
          </GlassPanel>

          <View style={styles.sectionTabs} accessibilityRole="tablist">
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: activeSection === "friends" }}
              onPress={() => setActiveSection("friends")}
              style={[styles.sectionTab, activeSection === "friends" && styles.sectionTabActive]}
            >
              <AppText variant="caption" style={[styles.sectionTabText, activeSection === "friends" && styles.sectionTabTextActive]}>Friends</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: activeSection === "find" }}
              onPress={() => setActiveSection("find")}
              style={[styles.sectionTab, activeSection === "find" && styles.sectionTabActive]}
            >
              <AppText variant="caption" style={[styles.sectionTabText, activeSection === "find" && styles.sectionTabTextActive]}>Find Friends</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: activeSection === "requests" }}
              onPress={() => setActiveSection("requests")}
              style={[styles.sectionTab, activeSection === "requests" && styles.sectionTabActive]}
            >
              <AppText variant="caption" style={[styles.sectionTabText, activeSection === "requests" && styles.sectionTabTextActive]}>
                Requests{incomingRequests.length > 0 ? " · " + incomingRequests.length : ""}
              </AppText>
            </Pressable>
          </View>

          {activeSection === "friends" ? (
            <View style={styles.sectionStack}>
              <View style={styles.row}>
                <AppText variant="h2" style={styles.sectionTitle}>Your friends</AppText>
                <View style={styles.count}>
                  <AppText variant="caption" style={{ color: colors.primary }}>{friends.length}</AppText>
                </View>
              </View>
              {friendsLoading ? (
                <GlassPanel padding={spacing.md}><LoadingState message="Loading your friends…" /></GlassPanel>
              ) : friends.length ? friends.map((friend) => (
                <GlassPanel key={friend.id} padding={spacing.md}>
                  <View style={styles.row}>
                    <FriendAvatar name={friend.name} />
                    <View style={styles.copy}>
                      <AppText variant="bodyMedium">{friend.name}</AppText>
                      <AppText variant="caption" style={styles.muted}>@{friend.username}</AppText>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={"Remove " + friend.name + " from friends"}
                      disabled={removingFriendId === friend.id}
                      onPress={() => confirmRemoveFriend(friend)}
                      hitSlop={10}
                      style={{ padding: spacing.xs }}
                    >
                      <Ionicons
                        name={removingFriendId === friend.id ? "hourglass-outline" : "person-remove-outline"}
                        size={20}
                        color={removingFriendId === friend.id ? colors.textMuted : colors.danger}
                      />
                    </Pressable>
                  </View>
                </GlassPanel>
              )) : (
                <GlassPanel padding={spacing.md}>
                  <EmptyState
                    icon="people-outline"
                    title="Your friend list is empty"
                    message="Find someone by username and send a request. Accepted requests will appear here."
                  />
                  <Pressable onPress={() => setActiveSection("find")} style={{ alignSelf: "center", paddingTop: spacing.sm }}>
                    <AppText variant="caption" style={{ color: colors.primary }}>Find friends</AppText>
                  </Pressable>
                </GlassPanel>
              )}
            </View>
          ) : null}

          {activeSection === "find" ? (
            <View style={styles.sectionStack}>
              <GlassPanel padding={spacing.lg} gap={spacing.md}>
                <View>
                  <AppText variant="h2">Find people</AppText>
                  <AppText variant="caption" style={styles.muted}>
                    Search for an existing DeepPay user with their exact username.
                  </AppText>
                </View>
                <View style={styles.inline}>
                  <View style={styles.prefix}><AppText variant="bodyMedium" style={{ color: colors.primary }}>@</AppText></View>
                  <TextInput
                    value={searchUsername}
                    onChangeText={(value) => {
                      setSearchUsername(value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                      setFoundUser(null);
                      setActionError(null);
                    }}
                    placeholder="friend_username"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.input, { flex: 1, opacity: handle ? 1 : 0.55 }]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={20}
                    editable={Boolean(handle)}
                    returnKeyType="search"
                    onSubmitEditing={() => { void findUser(); }}
                  />
                </View>
                {!handle ? (
                  <AppText variant="caption" style={styles.muted}>Create your username above to enable friend requests.</AppText>
                ) : null}
                <PrimaryButton
                  title={searchingUser ? "Searching…" : "Find user"}
                  onPress={() => { void findUser(); }}
                  disabled={!handle || searchingUser || searchUsername.trim().length < 3}
                />
              </GlassPanel>

              {foundUser ? (
                <GlassPanel padding={spacing.md} gap={spacing.md}>
                  <View style={styles.row}>
                    <FriendAvatar name={foundUser.displayName} />
                    <View style={styles.copy}>
                      <AppText variant="bodyMedium">{foundUser.displayName}</AppText>
                      <AppText variant="caption" style={{ color: colors.primary }}>@{foundUser.username}</AppText>
                      <AppText variant="caption" style={styles.muted}>DeepPay account found</AppText>
                    </View>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  </View>
                  <PrimaryButton
                    title={sendingRequest ? "Sending request…" : "Send friend request"}
                    onPress={() => { void addFriend(); }}
                    disabled={sendingRequest}
                  />
                </GlassPanel>
              ) : null}

              {actionError ? (
                <GlassPanel padding={spacing.md}>
                  <AppText variant="caption" style={{ color: colors.danger }}>{actionError}</AppText>
                </GlassPanel>
              ) : null}
              {notice ? (
                <GlassPanel padding={spacing.md}>
                  <AppText variant="caption" style={{ color: colors.success }}>{notice}</AppText>
                </GlassPanel>
              ) : null}
            </View>
          ) : null}

          {activeSection === "requests" ? (
            <View style={styles.sectionStack}>
              <View style={styles.row}>
                <AppText variant="h2" style={styles.sectionTitle}>Incoming requests</AppText>
                <View style={styles.count}>
                  <AppText variant="caption" style={{ color: colors.primary }}>{incomingRequests.length}</AppText>
                </View>
              </View>
              {requestsLoading ? (
                <GlassPanel padding={spacing.md}><LoadingState message="Loading friend requests…" /></GlassPanel>
              ) : incomingRequests.length ? incomingRequests.map((request) => (
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
                        {respondingId === request.id ? "Saving…" : "Reject"}
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
                  <EmptyState
                    icon="mail-open-outline"
                    title="No incoming requests"
                    message="New friend requests will appear here. You can find people by username and send them a request."
                  />
                </GlassPanel>
              )}

              <View style={styles.row}>
                <AppText variant="h2" style={styles.sectionTitle}>Sent requests</AppText>
                <View style={styles.count}>
                  <AppText variant="caption" style={{ color: colors.primary }}>{outgoingRequests.length}</AppText>
                </View>
              </View>
              {requestsLoading ? (
                <GlassPanel padding={spacing.md}><LoadingState message="Loading sent requests…" /></GlassPanel>
              ) : outgoingRequests.length ? outgoingRequests.map((request) => (
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
                <GlassPanel padding={spacing.md}>
                  <AppText variant="caption" style={styles.muted}>You have no pending sent requests.</AppText>
                </GlassPanel>
              )}

              {actionError ? (
                <GlassPanel padding={spacing.md}>
                  <AppText variant="caption" style={{ color: colors.danger }}>{actionError}</AppText>
                </GlassPanel>
              ) : null}
              {notice ? (
                <GlassPanel padding={spacing.md}>
                  <AppText variant="caption" style={{ color: colors.success }}>{notice}</AppText>
                </GlassPanel>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

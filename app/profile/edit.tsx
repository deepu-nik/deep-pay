import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { GlassPanel } from "@/src/components/common/GlassPanel";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, updateFullName } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (fullName.trim().length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateFullName(fullName);
      router.back();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We couldn't update your profile.");
    } finally {
      setSaving(false);
    }
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { flexGrow: 1, padding: spacing.lg, gap: spacing.xl },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    back: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.glassGradient[0], borderWidth: 1, borderColor: colors.glassBorder, alignItems: "center", justifyContent: "center" },
    field: { gap: spacing.xs },
    input: { minHeight: 54, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassGradient[0], color: colors.text, fontSize: 16 },
    readOnly: { minHeight: 54, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassGradient[0], justifyContent: "center" },
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.back}>
              <Ionicons name="arrow-back" size={21} color={colors.text} />
            </Pressable>
            <AppText variant="h2">Edit profile</AppText>
          </View>

          <GlassPanel padding={spacing.lg} style={{ gap: spacing.lg }}>
          <View style={{ gap: spacing.xs }}>
            <AppText variant="bodyMedium">Full name</AppText>
            <TextInput
              value={fullName}
              onChangeText={(value) => { setFullName(value); setError(null); }}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              style={styles.input}
            />
          </View>

          <View style={{ gap: spacing.xs }}>
            <AppText variant="bodyMedium">Email address</AppText>
            <View style={styles.readOnly}><AppText variant="body" style={{ color: colors.textMuted }}>{user?.email ?? "—"}</AppText></View>
            <AppText variant="caption" style={{ color: colors.textMuted }}>Your sign-in email is managed by Firebase Authentication and can't be edited here.</AppText>
          </View>

          </GlassPanel>

          {error ? <AppText variant="caption" style={{ color: colors.danger }}>{error}</AppText> : null}
          <PrimaryButton title={saving ? "Saving…" : "Save changes"} onPress={submit} disabled={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

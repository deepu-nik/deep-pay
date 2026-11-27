import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await signIn(email);
      router.replace("/(tabs)");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We couldn't sign you in.");
    } finally {
      setSaving(false);
    }
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { flexGrow: 1, padding: spacing.xl, gap: spacing.xl },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    back: { width: 42, height: 42, borderRadius: radius.md, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    field: { gap: spacing.xs },
    input: { minHeight: 56, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, fontSize: 16 },
    note: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, gap: spacing.xs },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.back}>
              <Ionicons name="arrow-back" size={21} color={colors.text} />
            </Pressable>
            <AppText variant="h2">Welcome back</AppText>
          </View>

          <View style={{ gap: spacing.sm }}>
            <AppText variant="title">Pick up where you left off.</AppText>
            <AppText variant="body" style={{ color: colors.textMuted }}>
              Enter the email address attached to your local DeepPay demo profile.
            </AppText>
          </View>

          <View style={styles.field}>
            <AppText variant="bodyMedium">Email address</AppText>
            <TextInput
              value={email}
              onChangeText={(value) => { setEmail(value); setError(null); }}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="done"
              onSubmitEditing={() => void submit()}
              style={styles.input}
            />
          </View>

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <AppText variant="caption" style={{ color: colors.textMuted }}>
              Demo sign-in only checks for a profile saved on this device. It does not verify email ownership or use a password.
            </AppText>
          </View>

          {error ? <AppText variant="caption" style={{ color: colors.danger }}>{error}</AppText> : null}
          <PrimaryButton title={saving ? "Signing in…" : "Continue"} onPress={submit} disabled={saving} />

          <AppText variant="body" style={{ color: colors.textMuted, textAlign: "center" }}>
            New to DeepPay? <AppText variant="bodyMedium" style={{ color: colors.primary }} onPress={() => router.replace("/auth/sign-up" as Href)}>Create a profile</AppText>
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

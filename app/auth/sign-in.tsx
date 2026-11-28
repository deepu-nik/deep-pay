import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { GlassPanel } from "@/src/components/common/GlassPanel";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await signIn(email, password);
      router.replace("/(tabs)");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We couldn't sign you in.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter your account email first.");
      return;
    }

    setResetting(true);
    setError(null);
    setNotice(null);
    try {
      await resetPassword(email);
      setNotice("If an account exists for this email, Firebase will send a password reset link.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We couldn't send a reset email.");
    } finally {
      setResetting(false);
    }
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { flexGrow: 1, padding: spacing.xl, gap: spacing.xl },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    back: { width: 42, height: 42, borderRadius: radius.md, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassGradient[0] },
    field: { gap: spacing.xs },
    input: { minHeight: 56, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassGradient[0], color: colors.text, fontSize: 16 },
    note: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.glassGradient[0], borderWidth: 1, borderColor: colors.glassBorder, gap: spacing.xs },
    textButton: { alignSelf: "flex-end", paddingVertical: spacing.xs },
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
              Sign in to your DeepPay account from any device.
            </AppText>
          </View>

          <GlassPanel padding={spacing.lg} style={{ gap: spacing.lg }}>
          <View style={styles.field}>
            <AppText variant="bodyMedium">Email address</AppText>
            <TextInput
              value={email}
              onChangeText={(value) => { setEmail(value); setError(null); setNotice(null); }}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <AppText variant="bodyMedium">Password</AppText>
            <TextInput
              value={password}
              onChangeText={(value) => { setPassword(value); setError(null); }}
              placeholder="Your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={() => void submit()}
              style={styles.input}
            />
            <Pressable onPress={() => void handleResetPassword()} disabled={resetting}>
              <AppText variant="caption" style={{ color: colors.primary, textAlign: "right" }}>
                {resetting ? "Sending reset link…" : "Forgot password?"}
              </AppText>
            </Pressable>
          </View>

          <View style={styles.note}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
            <AppText variant="caption" style={{ color: colors.textMuted }}>
              Your sign-in is securely managed by Firebase Authentication.
            </AppText>
          </View>

          </GlassPanel>

          {error ? <AppText variant="caption" style={{ color: colors.danger }}>{error}</AppText> : null}
          {notice ? <AppText variant="caption" style={{ color: colors.success }}>{notice}</AppText> : null}
          <PrimaryButton title={saving ? "Signing in…" : "Sign in"} onPress={submit} disabled={saving} />

          <AppText variant="body" style={{ color: colors.textMuted, textAlign: "center" }}>
            New to DeepPay? <AppText variant="bodyMedium" style={{ color: colors.primary }} onPress={() => router.replace("/auth/sign-up" as Href)}>Create an account</AppText>
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

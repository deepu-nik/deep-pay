import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

export default function SignUpScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { createProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (fullName.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createProfile({ fullName, email });
      router.replace("/(tabs)");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We couldn't create your profile.");
    } finally {
      setSaving(false);
    }
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { flexGrow: 1, padding: spacing.xl, gap: spacing.xl },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    back: { width: 42, height: 42, borderRadius: radius.md, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    form: { gap: spacing.md },
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
            <AppText variant="h2">Create profile</AppText>
          </View>

          <View style={{ gap: spacing.sm }}>
            <AppText variant="title">Let's get you set up.</AppText>
            <AppText variant="body" style={{ color: colors.textMuted }}>
              Add your details to start organising expenses with your friends.
            </AppText>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <AppText variant="bodyMedium">Full name</AppText>
              <TextInput
                value={fullName}
                onChangeText={(value) => { setFullName(value); setError(null); }}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                style={styles.input}
              />
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
          </View>

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <AppText variant="caption" style={{ color: colors.textMuted }}>
              This is a local demo profile. No password is requested or stored, and email ownership is not verified yet. Real authentication is part of the backend integration phase.
            </AppText>
          </View>

          {error ? <AppText variant="caption" style={{ color: colors.danger }}>{error}</AppText> : null}
          <PrimaryButton title={saving ? "Creating profile…" : "Create profile"} onPress={submit} disabled={saving} />

          <AppText variant="body" style={{ color: colors.textMuted, textAlign: "center" }}>
            Already have a profile? <AppText variant="bodyMedium" style={{ color: colors.primary }} onPress={() => router.replace("/auth/sign-in")}>Sign in</AppText>
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

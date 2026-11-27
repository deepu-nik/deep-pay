import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/src/components/common/AppText";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, padding: spacing.xl, justifyContent: "space-between" },
    brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
    brandMark: { width: 46, height: 46, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
    hero: { gap: spacing.lg },
    heroCard: { width: "100%", height: 230, borderRadius: radius.xl, overflow: "hidden", padding: spacing.xl, justifyContent: "space-between" },
    bubble: { position: "absolute", width: 170, height: 170, borderRadius: 85, backgroundColor: "rgba(255,255,255,0.12)", top: -64, right: -34 },
    miniCard: { backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", borderRadius: radius.md, padding: spacing.md, alignSelf: "flex-start" },
    features: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    feature: { flexDirection: "row", alignItems: "center", gap: spacing.xs, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    footer: { gap: spacing.md },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <LinearGradient colors={colors.gradientPrimary} style={styles.brandMark}>
            <Ionicons name="wallet" size={24} color={colors.onAccent} />
          </LinearGradient>
          <AppText variant="h2">DeepPay</AppText>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCard}>
            <LinearGradient colors={colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View style={styles.bubble} />
            <View>
              <AppText variant="caption" style={{ color: "rgba(255,255,255,0.82)", letterSpacing: 1 }}>YOUR MONEY, IN THE LOOP</AppText>
              <AppText variant="title" style={{ color: "#FFFFFF", fontSize: 29, lineHeight: 36, marginTop: spacing.md }}>Good with money. Better together.</AppText>
            </View>
            <View style={styles.miniCard}>
              <AppText variant="caption" style={{ color: "rgba(255,255,255,0.8)" }}>Shared expenses, made simple</AppText>
              <AppText variant="h2" style={{ color: "#FFFFFF" }}>Split. Track. Settle.</AppText>
            </View>
          </View>

          <AppText variant="title">Money with your people, minus the awkward math.</AppText>
          <AppText variant="body" style={{ color: colors.textMuted }}>
            Keep your group expenses organised, split bills fairly and stay on top of who owes whom.
          </AppText>

          <View style={styles.features}>
            {[
              { icon: "git-branch" as const, label: "Quick split" },
              { icon: "people" as const, label: "Shared groups" },
              { icon: "wallet" as const, label: "Track balances" },
            ].map((item) => (
              <View key={item.label} style={styles.feature}>
                <Ionicons name={item.icon} size={15} color={colors.primary} />
                <AppText variant="caption">{item.label}</AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton title="Create your profile" onPress={() => router.push("/auth/sign-up")} />
          <AppText variant="body" style={{ color: colors.textMuted, textAlign: "center" }}>
            Already set up on this device? <AppText variant="bodyMedium" style={{ color: colors.primary }} onPress={() => router.push("/auth/sign-in")}>Sign in</AppText>
          </AppText>
          <AppText variant="caption" style={{ color: colors.textMuted, textAlign: "center" }}>
            Demo mode · Your profile stays on this device for now
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}

import { Pressable, SafeAreaView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { GlassPanel } from "@/src/components/common/GlassPanel";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { useTheme } from "@/src/theme";
import { spacing } from "@/src/theme/tokens";

export default function FriendsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, justifyContent: "center", padding: spacing.lg },
    card: { alignItems: "center", gap: spacing.lg },
    icon: { width: 68, height: 68, borderRadius: 24, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center" },
    muted: { color: colors.textMuted, textAlign: "center" },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" style={{ marginBottom: spacing.lg }}>
          <Ionicons name="arrow-back" size={23} color={colors.text} />
        </Pressable>
        <GlassPanel padding={spacing.xl}>
          <View style={styles.card}>
            <View style={styles.icon}><Ionicons name="people-outline" size={31} color={colors.primary} /></View>
            <AppText variant="title" style={{ textAlign: "center" }}>Find your people</AppText>
            <AppText variant="body" style={styles.muted}>
              Username search and friend requests are coming next. For now, create a group and share its invite link to add real DeepPay members.
            </AppText>
            <PrimaryButton title="Open groups" onPress={() => router.replace("/(tabs)/groups" as any)} />
          </View>
        </GlassPanel>
      </View>
    </SafeAreaView>
  );
}

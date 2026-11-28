import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { GlassPanel } from "@/src/components/common/GlassPanel";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

type LegalSection = "terms" | "privacy" | "payments";

const policyContent: Record<LegalSection, {
  title: string;
  intro: string;
  paragraphs: string[];
  bullets: string[];
}> = {
  terms: {
    title: "Terms & conditions",
    intro: "These terms explain the basic rules for using DeepPay. By creating an account or continuing to use the app, you agree to use it responsibly.",
    paragraphs: [
      "DeepPay helps you organise personal expenses, shared group costs, friend connections and payment notes. It is a record-keeping and coordination tool, not a bank or a payment provider.",
      "You are responsible for the accuracy of information you enter, including names, group members, expense amounts, split details, UPI IDs and payment notes. Check entries before sharing or relying on them.",
      "Keep your sign-in credentials and device secure. Do not impersonate another person, misuse invitations, attempt to access another account or group without permission, or use DeepPay for unlawful, fraudulent or abusive activity.",
      "Group balances and settlement statuses are calculated from information entered by users. Confirm amounts and payment status directly with the people involved before making decisions or treating a balance as settled.",
      "DeepPay may change, suspend or remove features to maintain, improve or protect the service. Continued use after an update means you accept the revised in-app terms.",
    ],
    bullets: [
      "Use only a UPI ID that you have checked and are authorised to use.",
      "Invite only people who should have access to the relevant group information.",
      "Do not enter bank PINs, passwords, OTPs or other banking secrets into DeepPay.",
      "Report inaccurate or unexpected records to the people in the relevant group and correct the entry in the app where available.",
    ],
  },
  privacy: {
    title: "Privacy notice",
    intro: "DeepPay uses information needed to provide account, expense, group, friend and UPI convenience features.",
    paragraphs: [
      "Depending on the features you use, information may include your name, sign-in email, unique DeepPay username, friend requests, group names and membership, expense descriptions and amounts, split details, settlement notes, and the UPI ID and display name you choose to save.",
      "This information is used to sign you in, show your own records, coordinate shared groups, help users find one another by exact username, create receive QR codes, and sync the features you choose to use.",
      "Group expenses, group membership and settlement details may be visible to people who belong to that group. Your username is intended to be discoverable through exact-username search. Do not put private or sensitive information in group names, expense descriptions or notes.",
      "DeepPay uses Firebase services configured for the app to authenticate users and store or sync app records. The app may also keep selected preferences or UPI details on your device so the feature can work locally. Third-party services process information under their own terms and privacy practices.",
      "You can edit some profile details and sign out from Profile. Signing out does not itself delete cloud-stored account or expense data. DeepPay currently does not provide an in-app account-deletion workflow; this should be addressed before a public production launch.",
    ],
    bullets: [
      "Share only the information you need to complete the feature you are using.",
      "Review group membership before posting shared expenses or settlement records.",
      "Keep your device updated and protect access to your account.",
      "Do not treat a local device copy as proof that a record has synced to the cloud.",
    ],
  },
  payments: {
    title: "UPI & payment disclosure",
    intro: "DeepPay provides UPI convenience features only. It does not move money or verify payments with your bank.",
    paragraphs: [
      "When you choose to pay, DeepPay prepares a UPI payment request and hands it to a compatible UPI app on your device. The actual payment flow, authentication and transfer take place in that external app and with the relevant payment providers.",
      "A UPI ID and display name saved in DeepPay are self-entered and are not verified by DeepPay as belonging to you. Check the recipient name, UPI ID and amount in your UPI app before approving a payment.",
      "Returning to DeepPay, opening a QR code, or saving a payment note is not proof that money was transferred. A transaction record saved in DeepPay is labelled as reported by the user and is not bank-verified.",
      "Group settlement statuses are also based on information entered or confirmed by group members. They are not a bank statement, payment receipt or independent verification of a transfer.",
      "Never share your UPI PIN, bank password, card PIN or OTP with anyone. DeepPay will not ask you to enter those secrets into the app. For a payment dispute, check the transaction in your bank or UPI app and contact the relevant payment provider.",
    ],
    bullets: [
      "Verify the recipient and amount in your UPI app before authorising.",
      "Do not rely on a QR image or a payer-reported record as confirmation of receipt.",
      "Use your bank or UPI provider's official support for payment failures, reversals and disputes.",
    ],
  },
};

export default function LegalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const { colors } = useTheme();
  const section = params.section as LegalSection | undefined;
  const selected = section && section in policyContent
    ? [policyContent[section]]
    : Object.values(policyContent);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    back: {
      width: 44, height: 44, borderRadius: radius.md, borderWidth: 1,
      borderColor: colors.glassBorder, backgroundColor: colors.glassGradient[0],
      alignItems: "center", justifyContent: "center",
    },
    section: { gap: spacing.md },
    paragraph: { color: colors.textMuted, lineHeight: 22 },
    bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
    bullet: { color: colors.primary, fontWeight: "800" },
    footer: { color: colors.textMuted, lineHeight: 19 },
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.back}
          >
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <AppText variant="title">Legal & transparency</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted }}>
              Important information about DeepPay
            </AppText>
          </View>
        </View>
        {selected.map((item) => (
          <GlassPanel key={item.title} padding={spacing.lg}>
            <View style={styles.section}>
              <AppText variant="h2">{item.title}</AppText>
              <AppText variant="body" style={styles.paragraph}>{item.intro}</AppText>
              {item.paragraphs.map((paragraph, index) => (
                <AppText key={index} variant="body" style={styles.paragraph}>{paragraph}</AppText>
              ))}
              <AppText variant="bodyMedium">Please keep in mind</AppText>
              {item.bullets.map((bullet, index) => (
                <View key={index} style={styles.bulletRow}>
                  <AppText variant="body" style={styles.bullet}>•</AppText>
                  <AppText variant="body" style={[styles.paragraph, { flex: 1 }]}>{bullet}</AppText>
                </View>
              ))}
            </View>
          </GlassPanel>
        ))}
        <AppText variant="caption" style={styles.footer}>
          Last updated: 28 November 2026. These in-app disclosures describe the current feature set and should receive legal review and a verified support contact before DeepPay is released publicly.
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

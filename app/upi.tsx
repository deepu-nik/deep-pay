import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppText } from "@/src/components/common/AppText";
import { GlassPanel } from "@/src/components/common/GlassPanel";
import { LoadingState } from "@/src/components/common/LoadingState";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";
import {
  buildUpiPayUri,
  formatMinor,
  isValidVpa,
  normalizeVpa,
  parseMoneyToMinor,
  parseUpiQrData,
  type ParsedUpiPayment,
} from "@/src/services/upi/upiUtils";
import {
  firebaseUpiService,
  type UpiProfile,
  type UpiTransaction,
} from "@/src/services/firebase/upiService";

type UpiTab = "pay" | "scan" | "my-qr" | "history";
type PaymentSource = "scanned_qr" | "manual_vpa";
type PendingPayment = {
  payeeVpa: string;
  payeeName: string;
  amountMinor: number;
  note: string;
  source: PaymentSource;
  reference?: string;
  transactionId?: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently"
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function UpiScreen() {
  const router = useRouter();
  const { tab: routeTab } = useLocalSearchParams<{ tab?: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [activeTab, setActiveTab] = useState<UpiTab>("pay");
  const [profile, setProfile] = useState<UpiProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [vpa, setVpa] = useState("");
  const [displayName, setDisplayName] = useState(user?.fullName ?? "");

  const [payeeVpa, setPayeeVpa] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paymentSource, setPaymentSource] = useState<PaymentSource>("manual_vpa");
  const [scannedQr, setScannedQr] = useState(false);
  const [upiReference, setUpiReference] = useState("");
  const [upiTransactionId, setUpiTransactionId] = useState("");
  const [scanLocked, setScanLocked] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const pendingPaymentRef = useRef(false);
  const profileLoadedRef = useRef(false);
  const historyLoadedRef = useRef(false);
  const previousAppState = useRef<string>(AppState.currentState ?? "active");
  const [waitingForReturn, setWaitingForReturn] = useState(false);
  const [returnedToDeepPay, setReturnedToDeepPay] = useState(false);
  const [transactionReference, setTransactionReference] = useState("");
  const [recording, setRecording] = useState(false);
  const [transactions, setTransactions] = useState<UpiTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async (force = false) => {
    if (profileLoadedRef.current && !force) return;
    setProfileLoading(true);
    try {
      const nextProfile = await firebaseUpiService.getMyProfile();
      setProfile(nextProfile);
      setVpa(nextProfile?.vpa ?? "");
      setDisplayName(nextProfile?.displayName ?? user?.fullName ?? "");
      profileLoadedRef.current = true;
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Couldn't load your UPI details.");
    } finally {
      setProfileLoading(false);
    }
  }, [user?.fullName]);

  const loadTransactions = useCallback(async (force = false) => {
    if (historyLoadedRef.current && !force) return;
    setHistoryLoading(true);
    try {
      const nextTransactions = await firebaseUpiService.listRecentTransactions();
      setTransactions(nextTransactions);
      historyLoadedRef.current = true;
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Couldn't load payment records.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (routeTab === "pay" || routeTab === "scan" || routeTab === "my-qr" || routeTab === "history") {
      setActiveTab(routeTab);
    }
  }, [routeTab]);

  useEffect(() => {
    if (activeTab === "my-qr") void loadProfile();
    if (activeTab === "history") void loadTransactions();
  }, [activeTab, loadProfile, loadTransactions]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const wasAway = previousAppState.current === "background" || previousAppState.current === "inactive";
      if (pendingPaymentRef.current && wasAway && nextState === "active") {
        setReturnedToDeepPay(true);
        setWaitingForReturn(false);
        setMessage("You're back in DeepPay. Confirm below only if your UPI app showed that you completed the payment.");
      }
      previousAppState.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  const clearPendingPayment = () => {
    pendingPaymentRef.current = false;
    setPendingPayment(null);
    setWaitingForReturn(false);
    setReturnedToDeepPay(false);
    setTransactionReference("");
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl + 100, gap: spacing.lg },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    back: { width: 44, height: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassGradient[0], alignItems: "center", justifyContent: "center" },
    headerCopy: { flex: 1, gap: 2 },
    subtitle: { color: colors.textMuted },
    actionGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.sm },
    actionCard: { width: "48%", minHeight: 88, flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassGradient[0] },
    actionCardActive: { borderColor: colors.primary, backgroundColor: colors.iconBackground },
    actionIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.iconBackground },
    actionCopy: { flex: 1, gap: 3 },
    section: { gap: spacing.sm },
    label: { marginBottom: 2 },
    input: { minHeight: 52, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radius.md, paddingHorizontal: spacing.lg, color: colors.text, fontSize: 16, backgroundColor: colors.glassGradient[0] },
    inputMultiline: { minHeight: 84, textAlignVertical: "top", paddingTop: spacing.md },
    muted: { color: colors.textMuted, lineHeight: 20 },
    qrWrap: { alignItems: "center", padding: spacing.lg, backgroundColor: "#FFFFFF", borderRadius: radius.lg, gap: spacing.md },
    qrMeta: { alignItems: "center", gap: spacing.xs },
    qrValue: { color: "#211A33", fontWeight: "700" },
    camera: { height: 310, overflow: "hidden", borderRadius: radius.lg, backgroundColor: "#16131E" },
    cameraOverlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
    scanFrame: { width: 230, height: 230, borderRadius: 24, borderWidth: 3, borderColor: "#FFFFFF" },
    historyRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
    historyIcon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: colors.iconBackground },
    historyCopy: { flex: 1, gap: 3 },
    separator: { height: 1, backgroundColor: colors.glassBorder },
    warning: { color: colors.warning, lineHeight: 20 },
    error: { color: colors.danger, lineHeight: 20 },
    pendingActions: { gap: spacing.sm },
    statusBadge: { alignSelf: "flex-start", paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.iconBackground },
  });

  const selectTab = async (tab: UpiTab) => {
    setMessage(null);
    if (tab === "scan") {
      setScanError(null);
      setScanLocked(false);
      if (!cameraPermission?.granted) {
        const permission = await requestCameraPermission();
        if (!permission.granted) {
          setMessage("Camera permission is needed to scan a UPI QR code.");
          return;
        }
      }
    }
    setActiveTab(tab);
  };

  const applyScannedPayment = (parsed: ParsedUpiPayment) => {
    setPayeeVpa(parsed.payeeVpa);
    setPayeeName(parsed.payeeName);
    setAmount(parsed.amountMinor ? (parsed.amountMinor / 100).toFixed(2) : "");
    setNote(parsed.note ?? "");
    setPaymentSource("scanned_qr");
    setUpiReference(parsed.reference ?? "");
    setUpiTransactionId(parsed.transactionId ?? "");
    setScannedQr(true);
    setScanLocked(true);
    setScanError(null);
    setActiveTab("pay");
    setMessage("QR details loaded. Check the recipient and amount carefully before opening a UPI app.");
  };

  const handleBarcodeScanned = (result: { data: string }) => {
    if (scanLocked) return;
    setScanLocked(true);
    try {
      const parsed = parseUpiQrData(result.data);
      applyScannedPayment(parsed);
    } catch (cause) {
      setScanError(cause instanceof Error ? cause.message : "This QR code isn't supported.");
      setTimeout(() => setScanLocked(false), 1600);
    }
  };

  const openUpiApp = async () => {
    if (Platform.OS !== "android") {
      Alert.alert("Android required", "NPCI's current guidance describes UPI Intent for Android. On iPhone, use the UPI ID or show the QR code to another device.");
      return;
    }
    const normalizedVpa = normalizeVpa(payeeVpa);
    if (!isValidVpa(normalizedVpa)) {
      setMessage("Enter a valid recipient UPI ID or scan a UPI QR code first.");
      return;
    }
    const amountMinor = parseMoneyToMinor(amount);
    if (!amountMinor) {
      setMessage("Enter a valid amount greater than ₹0.00.");
      return;
    }
    const recipientName = payeeName.trim() || "UPI recipient";
    const pending: PendingPayment = {
      payeeVpa: normalizedVpa,
      payeeName: recipientName,
      amountMinor,
      note: note.trim().slice(0, 80),
      source: paymentSource,
      ...(upiReference ? { reference: upiReference } : {}),
      ...(upiTransactionId ? { transactionId: upiTransactionId } : {}),
    };
    const uri = buildUpiPayUri(pending);

    setMessage(null);
    setPendingPayment(pending);
    pendingPaymentRef.current = true;
    setWaitingForReturn(true);
    setReturnedToDeepPay(false);
    setTransactionReference("");
    try {
      await Linking.openURL(uri);
    } catch (cause) {
      pendingPaymentRef.current = false;
      setWaitingForReturn(false);
      setPendingPayment(null);
      setMessage(cause instanceof Error
        ? "No UPI app opened this payment request. Check that a UPI app is installed and set up."
        : "Couldn't open a UPI app. Please try again.");
    }
  };

  const recordPayment = async () => {
    if (!pendingPayment || recording || !returnedToDeepPay) return;
    setRecording(true);
    setMessage(null);
    try {
      await firebaseUpiService.recordOutgoing({
        payeeVpa: pendingPayment.payeeVpa,
        payeeName: pendingPayment.payeeName,
        amountMinor: pendingPayment.amountMinor,
        note: pendingPayment.note,
        transactionReference: transactionReference.trim(),
        source: pendingPayment.source,
      });
      clearPendingPayment();
      setPayeeVpa("");
      setPayeeName("");
      setAmount("");
      setNote("");
      setPaymentSource("manual_vpa");
      setScannedQr(false);
      setActiveTab("history");
      setMessage("Saved as a payment reported by you. DeepPay has not verified the transfer with your bank.");
      historyLoadedRef.current = false;
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Couldn't save this payment record.");
    } finally {
      setRecording(false);
    }
  };

  const saveProfile = async () => {
    if (savingProfile) return;
    setSavingProfile(true);
    setMessage(null);
    try {
      const saved = await firebaseUpiService.saveMyProfile({
        vpa,
        displayName: displayName || user?.fullName || "",
      });
      setProfile(saved);
      setVpa(saved.vpa);
      setDisplayName(saved.displayName);
      profileLoadedRef.current = true;
      setMessage("Your UPI QR details are saved to your DeepPay account.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Couldn't save your UPI details.");
    } finally {
      setSavingProfile(false);
    }
  };

  const shareMyUpi = async () => {
    if (!profile) return;
    const uri = buildUpiPayUri({ payeeVpa: profile.vpa, payeeName: profile.displayName });
    try {
      await Share.share({
        message: "Pay me on UPI. UPI ID: " + profile.vpa + "\n" + uri,
      });
    } catch {
      setMessage("Couldn't open the share sheet.");
    }
  };

  const resetScan = () => {
    setScanLocked(false);
    setScanError(null);
    setMessage(null);
    setActiveTab("scan");
  };

  const receiveUri = profile
    ? buildUpiPayUri({ payeeVpa: profile.vpa, payeeName: profile.displayName })
    : "";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="title">UPI & QR</AppText>
            <AppText variant="caption" style={styles.subtitle}>Pay, scan and share your payment QR.</AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open my receive QR code"
            onPress={() => { void selectTab("my-qr"); }}
            style={styles.back}
          >
            <Ionicons name="qr-code-outline" size={21} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.actionGrid}>
          {([
            { tab: "pay", title: "Pay someone", subtitle: "Enter UPI ID and amount", icon: "wallet-outline" },
            { tab: "scan", title: "Scan to Pay", subtitle: "Scan any UPI QR", icon: "scan-outline" },
            { tab: "my-qr", title: "My QR", subtitle: "Receive a payment", icon: "qr-code-outline" },
            { tab: "history", title: "History", subtitle: "Your saved payment records", icon: "time-outline" },
          ] as const).map((item) => (
            <Pressable
              key={item.tab}
              accessibilityRole="button"
              accessibilityState={{ selected: activeTab === item.tab }}
              onPress={() => { void selectTab(item.tab); }}
              style={[styles.actionCard, activeTab === item.tab && styles.actionCardActive]}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.actionCopy}>
                <AppText variant="bodyMedium">{item.title}</AppText>
                <AppText variant="caption" style={styles.muted}>{item.subtitle}</AppText>
              </View>
            </Pressable>
          ))}
        </View>

        {message ? (
          <GlassPanel padding={spacing.md}>
            <AppText variant="caption" style={{ color: message.toLowerCase().includes("couldn't") || message.toLowerCase().includes("not verified") || message.toLowerCase().includes("denied") ? colors.warning : colors.text }}>
              {message}
            </AppText>
          </GlassPanel>
        ) : null}

        {activeTab === "pay" ? (
          <>
            <GlassPanel padding={spacing.lg} gap={spacing.md}>
              <AppText variant="h2">Pay using any UPI app</AppText>
              <AppText variant="caption" style={styles.muted}>
                Enter a UPI ID or scan a payment QR. DeepPay will hand the request to an installed UPI app on Android.
              </AppText>
              <View style={styles.section}>
                <AppText variant="bodyMedium">Recipient UPI ID</AppText>
                <TextInput
                  value={payeeVpa}
                  onChangeText={(value) => { setPayeeVpa(value); setPaymentSource("manual_vpa"); setScannedQr(false); setUpiReference(""); setUpiTransactionId(""); }}
                  placeholder="name@bank"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.section}>
                <AppText variant="bodyMedium">Recipient name</AppText>
                <TextInput
                  value={payeeName}
                  onChangeText={setPayeeName}
                  placeholder="Name shown by the recipient"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  maxLength={80}
                />
              </View>
              <View style={styles.section}>
                <AppText variant="bodyMedium">Amount</AppText>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="₹0.00"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.section}>
                <AppText variant="bodyMedium">Note (optional)</AppText>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="What's this payment for?"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, styles.inputMultiline]}
                  multiline
                  maxLength={80}
                />
              </View>
              {scannedQr ? (
                <View style={styles.statusBadge}>
                  <AppText variant="caption" style={{ color: colors.primary }}>Details loaded from scanned QR</AppText>
                </View>
              ) : null}
              <PrimaryButton title="Open UPI app" onPress={openUpiApp} disabled={Boolean(pendingPayment) || !isValidVpa(payeeVpa) || !parseMoneyToMinor(amount)} />
              {Platform.OS !== "android" ? (
                <AppText variant="caption" style={styles.warning}>
                  UPI Intent is currently an Android flow. On iPhone, use the QR to start payment in a compatible UPI app from another device.
                </AppText>
              ) : null}
            </GlassPanel>

            {pendingPayment ? (
              <GlassPanel padding={spacing.lg} gap={spacing.md}>
                <AppText variant="h2">{returnedToDeepPay ? "Welcome back" : "Waiting for UPI app"}</AppText>
                <AppText variant="body" style={styles.muted}>
                  {returnedToDeepPay
                    ? "Check the UPI app's result. Only continue if you completed the payment."
                    : "Complete or cancel the payment in your UPI app, then return to DeepPay. Opening the app does not mean money was transferred."}
                </AppText>
                {waitingForReturn ? (
                  <PrimaryButton
                    title="I'm back in DeepPay"
                    onPress={() => { setWaitingForReturn(false); setReturnedToDeepPay(true); }}
                  />
                ) : null}
                {returnedToDeepPay ? (
                  <>
                    <View style={styles.section}>
                      <AppText variant="bodyMedium">UPI reference / UTR (optional)</AppText>
                      <TextInput
                        value={transactionReference}
                        onChangeText={setTransactionReference}
                        placeholder="Enter the reference from your UPI app"
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                        autoCapitalize="characters"
                        maxLength={64}
                      />
                    </View>
                    <AppText variant="caption" style={styles.warning}>
                      This entry is a statement by you. DeepPay cannot verify the UTR or bank transfer.
                    </AppText>
                    <PrimaryButton title={recording ? "Saving record…" : "I completed the payment"} onPress={() => { void recordPayment(); }} disabled={recording} />
                    <Pressable onPress={clearPendingPayment} style={{ alignItems: "center", paddingVertical: spacing.sm }}>
                      <AppText variant="caption" style={{ color: colors.textMuted }}>I didn't pay</AppText>
                    </Pressable>
                  </>
                ) : null}
              </GlassPanel>
            ) : null}
          </>
        ) : null}

        {activeTab === "scan" ? (
          <GlassPanel padding={spacing.lg} gap={spacing.md}>
            <AppText variant="h2">Scan any UPI QR</AppText>
            <AppText variant="caption" style={styles.muted}>Scan a UPI payment QR. DeepPay checks the payment address and shows the details before you leave this app.</AppText>
            {!cameraPermission ? (
              <LoadingState message="Checking camera permission…" />
            ) : !cameraPermission.granted ? (
              <>
                <AppText variant="caption" style={styles.muted}>Allow camera access to scan a QR code.</AppText>
                <PrimaryButton title="Allow camera" onPress={() => { void requestCameraPermission(); }} />
              </>
            ) : (
              <View style={styles.camera}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                  onBarcodeScanned={scanLocked ? undefined : handleBarcodeScanned}
                />
                <View pointerEvents="none" style={styles.cameraOverlay}>
                  <View style={styles.scanFrame} />
                </View>
              </View>
            )}
            {scanError ? <AppText variant="caption" style={styles.error}>{scanError}</AppText> : null}
            <Pressable onPress={resetScan} style={{ alignItems: "center", paddingVertical: spacing.sm }}>
              <AppText variant="caption" style={{ color: colors.primary }}>Scan again</AppText>
            </Pressable>
          </GlassPanel>
        ) : null}

        {activeTab === "my-qr" ? (
          <>
            <GlassPanel padding={spacing.lg} gap={spacing.md}>
              <AppText variant="h2">Your UPI details</AppText>
              <AppText variant="caption" style={styles.muted}>
                Use a UPI ID that belongs to you. DeepPay builds a static receive QR from the details you enter; it doesn't verify ownership with your bank.
              </AppText>
              {profileLoading ? <LoadingState message="Loading your UPI profile…" /> : null}
              {!profileLoading && !profileLoadedRef.current ? (
                <Pressable onPress={() => { void loadProfile(true); }} style={{ paddingVertical: spacing.xs }}>
                  <AppText variant="caption" style={{ color: colors.primary }}>Tap to retry loading your saved UPI details</AppText>
                </Pressable>
              ) : null}
              <View style={styles.section}>
                <AppText variant="bodyMedium">Your UPI ID</AppText>
                <TextInput
                  value={vpa}
                  onChangeText={setVpa}
                  placeholder="yourname@bank"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!profileLoading}
                />
              </View>
              <View style={styles.section}>
                <AppText variant="bodyMedium">Name shown to payers</AppText>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder={user?.fullName ?? "Your name"}
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  maxLength={80}
                  editable={!profileLoading}
                />
              </View>
              <PrimaryButton title={savingProfile ? "Saving…" : "Save UPI details"} onPress={() => { void saveProfile(); }} disabled={profileLoading || savingProfile || !isValidVpa(vpa) || displayName.trim().length < 2} />
            </GlassPanel>

            {profile ? (
              <GlassPanel padding={spacing.lg} gap={spacing.md}>
                <AppText variant="h2">Your receive QR</AppText>
                <View style={styles.qrWrap}>
                  <QRCode value={receiveUri} size={224} color="#211A33" backgroundColor="#FFFFFF" quietZone={12} ecl="Q" />
                  <View style={styles.qrMeta}>
                    <AppText variant="bodyMedium" style={styles.qrValue}>{profile.displayName}</AppText>
                    <AppText variant="caption" style={styles.qrValue}>UPI ID: {profile.vpa}</AppText>
                  </View>
                </View>
                <AppText variant="caption" style={styles.muted}>Show this QR to someone paying you. Ask them to confirm the name and UPI ID in their UPI app before approving.</AppText>
                <PrimaryButton title="Share UPI details" onPress={() => { void shareMyUpi(); }} />
              </GlassPanel>
            ) : (
              <GlassPanel padding={spacing.lg}>
                <AppText variant="body" style={styles.muted}>Save your UPI ID to create your personal receive QR.</AppText>
              </GlassPanel>
            )}
          </>
        ) : null}

        {activeTab === "history" ? (
          <GlassPanel padding={spacing.lg} gap={spacing.md}>
            <View style={styles.header}>
              <AppText variant="h2" style={{ flex: 1 }}>Payment records</AppText>
              <Pressable onPress={() => { void loadTransactions(true); }} accessibilityLabel="Refresh payment history">
                <Ionicons name="refresh-outline" size={20} color={colors.primary} />
              </Pressable>
            </View>
            <AppText variant="caption" style={styles.muted}>
              Records you explicitly saved after returning from a UPI app. These are not bank-verified transactions.
            </AppText>
            {historyLoading ? <LoadingState message="Loading payment records…" /> : !historyLoadedRef.current ? (
              <Pressable onPress={() => { void loadTransactions(true); }} style={{ paddingVertical: spacing.xs }}>
                <AppText variant="caption" style={{ color: colors.primary }}>Tap to retry loading payment records</AppText>
              </Pressable>
            ) : transactions.length === 0 ? (
              <AppText variant="body" style={styles.muted}>No UPI payment records yet.</AppText>
            ) : transactions.map((transaction, index) => (
              <View key={transaction.id}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <View style={styles.historyRow}>
                  <View style={styles.historyIcon}><Ionicons name="arrow-forward" size={19} color={colors.primary} /></View>
                  <View style={styles.historyCopy}>
                    <AppText variant="bodyMedium">{transaction.payeeName}</AppText>
                    <AppText variant="caption" style={styles.muted}>{transaction.payeeVpa} · {formatDate(transaction.createdAt)}</AppText>
                    <AppText variant="caption" style={styles.warning}>Reported by you · Not bank-verified</AppText>
                    {transaction.transactionReference ? <AppText variant="caption" style={styles.muted}>Ref: {transaction.transactionReference}</AppText> : null}
                  </View>
                  <AppText variant="bodyMedium">{formatMinor(transaction.amountMinor)}</AppText>
                </View>
              </View>
            ))}
          </GlassPanel>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { type Href, useRouter } from "expo-router";
import { AppText } from "@/src/components/common/AppText";
import { useTheme } from "@/src/theme";
import { spacing } from "@/src/theme/tokens";
import { parseUpiQrData } from "@/src/services/upi/upiUtils";

export default function FullScreenUpiScanner() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanLocked, setScanLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestedPermissionRef = useRef(false);

  useEffect(() => {
    if (!permission || permission.granted || !permission.canAskAgain || requestedPermissionRef.current) return;
    requestedPermissionRef.current = true;
    void requestPermission();
  }, [permission, requestPermission]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanLocked) return;
    setScanLocked(true);
    setError(null);
    try {
      const parsed = parseUpiQrData(data);
      router.replace({
        pathname: "/upi",
        params: {
          tab: "pay",
          payeeVpa: parsed.payeeVpa,
          payeeName: parsed.payeeName,
          amount: parsed.amountMinor ? (parsed.amountMinor / 100).toFixed(2) : "",
          note: parsed.note ?? "",
          reference: parsed.reference ?? "",
          transactionId: parsed.transactionId ?? "",
        },
      } as Href);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This QR code isn't supported. Scan a UPI payment QR.");
      setTimeout(() => setScanLocked(false), 1800);
    }
  };

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#090812" },
    camera: { ...StyleSheet.absoluteFill },
    shade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(9,8,18,0.16)" },
    safe: { flex: 1, paddingHorizontal: spacing.lg },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: spacing.xs },
    close: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(12,10,24,0.68)", borderWidth: 1, borderColor: "rgba(255,255,255,0.24)" },
    headerTitle: { color: "#FFFFFF", fontWeight: "800" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg },
    title: { color: "#FFFFFF", textAlign: "center" },
    subtitle: { color: "rgba(255,255,255,0.78)", textAlign: "center", maxWidth: 300, lineHeight: 21 },
    frameWrap: { width: 292, height: 292, maxWidth: "85%", maxHeight: "48%", alignItems: "center", justifyContent: "center" },
    frame: { width: "100%", height: "100%", borderRadius: 30, borderWidth: 3, borderColor: "#FFFFFF" },
    corner: { position: "absolute", width: 34, height: 34, borderColor: colors.primary, borderWidth: 5 },
    topLeft: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 16 },
    topRight: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 16 },
    bottomLeft: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 16 },
    bottomRight: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 16 },
    footer: { alignItems: "center", gap: spacing.md, paddingBottom: Math.max(insets.bottom, spacing.lg) },
    hint: { color: "rgba(255,255,255,0.78)", textAlign: "center" },
    error: { color: "#FFD5D5", textAlign: "center", backgroundColor: "rgba(125,20,35,0.68)", padding: spacing.md, borderRadius: 12 },
    permissionPanel: { gap: spacing.md, padding: spacing.xl, borderRadius: 24, backgroundColor: "rgba(20,17,35,0.9)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", width: "100%" },
    permissionText: { color: "#FFFFFF", textAlign: "center" },
    permissionButton: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
    permissionButtonText: { color: colors.onAccent, fontWeight: "800" },
  });

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {permission?.granted ? (
        <>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanLocked ? undefined : handleBarcodeScanned}
          />
          <View pointerEvents="none" style={styles.shade} />
        </>
      ) : null}
      <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close scanner"
            onPress={() => router.back()}
            style={styles.close}
          >
            <Ionicons name="close" size={25} color="#FFFFFF" />
          </Pressable>
          <AppText variant="bodyMedium" style={styles.headerTitle}>SCAN TO PAY</AppText>
          <View style={{ width: 46 }} />
        </View>

        <View style={styles.center}>
          {permission?.granted ? (
            <>
              <AppText variant="title" style={styles.title}>Scan any UPI QR</AppText>
              <AppText variant="caption" style={styles.subtitle}>
                Place the payment QR inside the frame. We’ll show the recipient and amount before opening your UPI app.
              </AppText>
              <View style={styles.frameWrap}>
                <View style={styles.frame} />
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </>
          ) : (
            <View style={styles.permissionPanel}>
              <Ionicons name="camera-outline" size={42} color="#FFFFFF" style={{ alignSelf: "center" }} />
              <AppText variant="h2" style={styles.permissionText}>Camera access needed</AppText>
              <AppText variant="caption" style={styles.subtitle}>
                Allow camera access so DeepPay can scan UPI payment QR codes.
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => { requestedPermissionRef.current = true; void requestPermission(); }}
                style={styles.permissionButton}
              >
                <AppText variant="bodyMedium" style={styles.permissionButtonText}>Allow camera</AppText>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {error ? <AppText variant="caption" style={styles.error}>{error}</AppText> : null}
          <AppText variant="caption" style={styles.hint}>
            Only UPI payment QR codes are supported. Check the payee details before paying.
          </AppText>
        </View>
      </SafeAreaView>
    </View>
  );
}

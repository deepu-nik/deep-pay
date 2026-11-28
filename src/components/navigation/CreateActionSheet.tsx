import { LinearGradient } from "expo-linear-gradient";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { AppText } from "@/src/components/common/AppText";
import { GlassPanel } from "@/src/components/common/GlassPanel";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

type Action = { label: string; icon: keyof typeof Ionicons.glyphMap; description: string };

const actions: Action[] = [
  { label: "Create Group", icon: "people-outline", description: "Start a trip, club, or shared expense group" },
  { label: "UPI & QR", icon: "qr-code-outline", description: "Scan, pay or share your personal UPI QR" },
  { label: "Add Friend", icon: "person-add-outline", description: "Add someone to your DeepPay friends" },
  { label: "Split a Bill", icon: "git-branch-outline", description: "Quickly split a bill with friends" },
  { label: "Add Expense", icon: "receipt-outline", description: "Record something you paid for" },
];

export function CreateActionSheet({
  visible,
  onClose,
  onAction,
}: {
  visible: boolean;
  onClose: () => void;
  onAction?: (label: string) => void;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(12,7,28,0.48)" },
    sheet: {
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    sheetContent: {
      paddingTop: spacing.xl - spacing.lg,
      paddingBottom: Math.max(0, Math.max(spacing.lg, insets.bottom + spacing.md) - spacing.lg),
      gap: spacing.xs,
    },
    handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: "center", marginBottom: spacing.lg },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md },
    action: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, minHeight: 76 },
    actionPressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
    icon: { width: 52, height: 52, borderRadius: 19, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    copy: { flex: 1, gap: 3 },
    close: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: colors.glassGradient[0], borderWidth: 1, borderColor: colors.glassBorder },
  });

  const handleAction = (label: string) => {
    if (label === "Split a Bill") router.push({ pathname: "/expenses/new", params: { intent: "split" } });
    if (label === "Add Expense") router.push("/expenses/new");
    if (label === "Create Group") router.push("/groups");
    if (label === "Add Friend") router.push("/friends");
    if (label === "UPI & QR") router.push("/upi" as Href);
    onAction?.(label);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <GlassPanel padding={spacing.lg} style={styles.sheet}>
          <View style={styles.sheetContent}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <AppText variant="h2">Make a move ✨</AppText>
              <AppText variant="caption" style={{ color: colors.textMuted }}>
                What are we doing today?
              </AppText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={21} color={colors.text} />
            </Pressable>
          </View>

          {actions.map((action) => {
            const gradient = action.label === "Create Group" || action.label === "UPI & QR"
              ? colors.gradientSky
              : action.label === "Add Friend"
                ? colors.gradientSunset
                : colors.gradientPrimary;
            const iconColor = action.label === "Split a Bill" || action.label === "Add Expense"
              ? colors.white
              : colors.onAccent;
            return (
              <Pressable
                accessibilityRole="button"
                key={action.label}
                onPress={() => handleAction(action.label)}
                style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
              >
                <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.icon}>
                  <Ionicons name={action.icon} size={23} color={iconColor} />
                </LinearGradient>
                <View style={styles.copy}>
                  <AppText variant="bodyMedium">{action.label}</AppText>
                  <AppText variant="caption" style={{ color: colors.textMuted }}>{action.description}</AppText>
                </View>
                <Ionicons name="chevron-forward" size={19} color={colors.textMuted} />
              </Pressable>
            );
          })}
          </View>
          </GlassPanel>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

type Action = { label: string; icon: keyof typeof Ionicons.glyphMap; description: string };
const actions: Action[] = [
  { label: "Add Expense", icon: "receipt-outline", description: "Record something you paid for" },
  { label: "Split Bill", icon: "git-branch-outline", description: "Split an expense with friends" },
  { label: "Request Money", icon: "arrow-down-circle-outline", description: "Ask someone to pay you back" },
  { label: "Create Group", icon: "people-outline", description: "Start a trip, club, or shared expense group" },
];

export function CreateActionSheet({ visible, onClose, onAction }: { visible: boolean; onClose: () => void; onAction?: (label: string) => void }) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: 28 },
    handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: "center", marginBottom: spacing.xl },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.lg },
    action: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, minHeight: 68 },
    actionPressed: { opacity: 0.6 },
    icon: { width: 46, height: 46, borderRadius: 13, backgroundColor: colors.iconBackground, alignItems: "center", justifyContent: "center" },
    copy: { flex: 1, gap: 2 },
  });
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><Pressable style={styles.backdrop} onPress={onClose}><Pressable style={styles.sheet} onPress={e => e.stopPropagation()}><View style={styles.handle} /><View style={styles.header}><View><AppText variant="h2">What do you want to do?</AppText><AppText variant="caption" style={{ color: colors.textMuted }}>Choose an action to get started.</AppText></View><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose}><Ionicons name="close" size={24} color={colors.textMuted} /></Pressable></View>{actions.map(action => <Pressable accessibilityRole="button" key={action.label} onPress={() => { onAction?.(action.label); onClose(); }} style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}><View style={styles.icon}><Ionicons name={action.icon} size={21} color={colors.primary} /></View><View style={styles.copy}><AppText variant="bodyMedium">{action.label}</AppText><AppText variant="caption" style={{ color: colors.textMuted }}>{action.description}</AppText></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable>)}</Pressable></Pressable></Modal>;
}

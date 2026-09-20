import { View, type ViewProps } from "react-native";
import { colors, radius, spacing } from "@/src/theme/tokens";

export function AppCard({ style, ...props }: ViewProps) {
  return <View {...props} style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg }, style]} />;
}

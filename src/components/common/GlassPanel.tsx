import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

type GlassPanelProps = ViewProps & {
  padding?: number;
  gap?: number;
};

export function GlassPanel({ children, padding = spacing.lg, gap = 0, style, ...props }: GlassPanelProps) {
  const { colors } = useTheme();

  return (
    <View
      {...props}
      style={[
        styles.shell,
        {
          borderRadius: radius.xl,
          borderColor: colors.glassBorder,
          shadowColor: colors.primary,
        },
        style,
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={colors.glassGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[styles.highlight, { backgroundColor: colors.glassHighlight }]} />
      <View style={{ padding, gap }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  highlight: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    height: 1,
  },
});
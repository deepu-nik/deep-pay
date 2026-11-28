import type { ViewProps } from "react-native";
import { GlassPanel } from "@/src/components/common/GlassPanel";
import { spacing } from "@/src/theme/tokens";

export function AppCard({ style, ...props }: ViewProps) {
  return <GlassPanel {...props} padding={spacing.lg} style={style} />;
}

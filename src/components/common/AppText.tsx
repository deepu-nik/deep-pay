import { Text, type TextProps } from "react-native";
import { colors, typography } from "@/src/theme/tokens";

type Variant = keyof typeof typography;
export function AppText({ variant = "body", style, ...props }: TextProps & { variant?: Variant }) {
  return <Text {...props} style={[{ color: colors.text, ...typography[variant] }, style]} />;
}

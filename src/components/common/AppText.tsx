import { Text, type TextProps } from "react-native";
import { useTheme } from "@/src/theme";
import { typography } from "@/src/theme/tokens";

type Variant = keyof typeof typography;
export function AppText({ variant = "body", style, ...props }: TextProps & { variant?: Variant }) {
  const { colors } = useTheme();
  return <Text {...props} style={[{ color: colors.text, ...typography[variant] }, style]} />;
}

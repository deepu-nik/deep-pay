export const colors = {
  background: "#F7F8FA",
  surface: "#FFFFFF",
  surfaceMuted: "#F0F2F5",
  text: "#111827",
  textMuted: "#667085",
  border: "#E4E7EC",
  primary: "#2563EB",
  primaryPressed: "#1D4ED8",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  white: "#FFFFFF",
  black: "#000000",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;
export const typography = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: "700" as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: "400" as const },
  bodyMedium: { fontSize: 16, lineHeight: 22, fontWeight: "600" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
  amount: { fontSize: 30, lineHeight: 36, fontWeight: "700" as const },
};

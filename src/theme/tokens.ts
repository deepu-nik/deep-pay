export type ThemeColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryPressed: string;
  success: string;
  warning: string;
  danger: string;
  iconBackground: string;
  expenseIconBackground: string;
  accentYellow: string;
  accentPink: string;
  accentBlue: string;
  accentMint: string;
  gradientPrimary: [string, string];
  gradientSunset: [string, string];
  gradientSky: [string, string];
  gradientMint: [string, string];
  white: string;
  black: string;
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40 } as const;
export const radius = { sm: 12, md: 18, lg: 24, xl: 30, pill: 999 } as const;

export const typography = {
  title: { fontSize: 30, lineHeight: 37, fontWeight: "800" as const, letterSpacing: -0.7 },
  h2: { fontSize: 21, lineHeight: 27, fontWeight: "800" as const, letterSpacing: -0.35 },
  body: { fontSize: 16, lineHeight: 23, fontWeight: "400" as const },
  bodyMedium: { fontSize: 16, lineHeight: 22, fontWeight: "700" as const, letterSpacing: -0.15 },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
  amount: { fontSize: 36, lineHeight: 43, fontWeight: "800" as const, letterSpacing: -1.1 },
};

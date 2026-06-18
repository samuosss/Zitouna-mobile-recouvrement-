export const colors = {
  // Core
  primary: "#004d34",
  primaryContainer: "#006747",
  onPrimary: "#ffffff",
  onPrimaryContainer: "#8fe2ba",
  primaryFixed: "#a0f4ca",
  primaryFixedDim: "#84d7af",

  secondary: "#506600",
  secondaryContainer: "#caee5d",
  onSecondary: "#ffffff",
  onSecondaryContainer: "#546b00",
  secondaryFixed: "#ccf05f",
  secondaryFixedDim: "#b1d446",

  tertiary: "#712c29",
  tertiaryContainer: "#8e433e",
  onTertiary: "#ffffff",
  onTertiaryContainer: "#ffc3bd",
  tertiaryFixed: "#ffdad6",
  tertiaryFixedDim: "#ffb3ad",

  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onError: "#ffffff",
  onErrorContainer: "#93000a",

  // Surfaces
  background: "#faf9f6",
  surface: "#faf9f6",
  surfaceBright: "#faf9f6",
  surfaceDim: "#dadad7",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f4f4f0",
  surfaceContainer: "#eeeeea",
  surfaceContainerHigh: "#e8e8e5",
  surfaceContainerHighest: "#e2e3df",
  surfaceVariant: "#e2e3df",

  // Text / outline
  onBackground: "#1a1c1a",
  onSurface: "#1a1c1a",
  onSurfaceVariant: "#3f4943",
  outline: "#6f7a72",
  outlineVariant: "#bec9c1",
  inverseSurface: "#2f312f",
  inverseOnSurface: "#f1f1ed",
  inversePrimary: "#84d7af",

  // Legacy aliases (kept so existing screens don't break)
  primaryLight: "#84d7af",
  primaryDark: "#004d34",
  accent: "#ccf05f",
  accentDark: "#b1d446",
  danger: "#ba1a1a",
  warning: "#f59e0b",
  info: "#185FA5",
  success: "#006747",
  white: "#ffffff",
  card: "#ffffff",
  border: "#bec9c1",
  borderLight: "#e2e3df",
  textPrimary: "#1a1c1a",
  textSecondary: "#3f4943",
  textMuted: "#6f7a72",

  // Status badges (mapped to new tokens)
  statuts: {
    Actif:    { bg: "#caee5d", text: "#546b00" }, // secondary-container / on-secondary-container
    Cloture:  { bg: "#e2e3df", text: "#3f4943" }, // surface-variant / on-surface-variant
    Suspendu: { bg: "#fdf0d5", text: "#92400E" }, // keep warm warning tone
    EnLitige: { bg: "#ffdad6", text: "#93000a" }, // tertiary-fixed / on-tertiary-fixed-variant
    Urgent:   { bg: "#ffdad6", text: "#93000a" }, // error-container / on-error-container
    Veille:   { bg: "#e2e3df", text: "#3f4943" },
  },

  // Priority dot colors
  priorites: {
    Basse:    "#3B82F6",
    Normale:  "#9CA3AF",
    Haute:    "#F97316",
    Critique: "#ba1a1a",
  },
};
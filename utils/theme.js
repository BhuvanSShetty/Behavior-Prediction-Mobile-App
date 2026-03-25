// ─── Professional palette ─────────────────────────────────────────────────────
// Base:   deep warm slate  (not pure #000)
// Accent: indigo — calm, modern, readable
// Status: muted semantic colours that communicate without screaming

export const C = {
  // Backgrounds
  bg:       "#0D0D14",
  card:     "#13131C",
  elevated: "#1A1A26",
  input:    "#10101A",

  // Borders
  border:      "#22222F",
  borderFocus: "#6366F1",

  // Primary accent — indigo
  accent:    "#6366F1",
  accentSoft:"#6366F120",
  accentDim: "#4F52D4",

  // Status colours — desaturated, professional
  success: "#34D399",   // emerald
  warning: "#FBBF24",   // amber
  danger:  "#F87171",   // rose
  info:    "#60A5FA",   // sky

  // Text
  textPrimary:   "#E8E8F0",
  textSecondary: "#6B6B8A",
  textMuted:     "#35354A",

  // Aliases used in screen imports
  green:  "#34D399",
  yellow: "#FBBF24",
  red:    "#F87171",
  blue:   "#60A5FA",
  purple: "#A78BFA",
  orange: "#FB923C",
};

export const S = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const R = {
  sm: 6, md: 10, lg: 16, xl: 22, full: 999,
};

export const stateColor = (state) => {
  switch (state) {
    case "Normal":     return C.success;
    case "Frustrated": return C.warning;
    case "Addicted":   return C.danger;
    default:           return C.textSecondary;
  }
};

export const riskColor = (risk) => {
  if (risk >= 70) return C.danger;
  if (risk >= 40) return C.warning;
  return C.success;
};
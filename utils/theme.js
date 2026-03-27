// ─── Professional palette ─────────────────────────────────────────────────────
// Base:   deep warm slate  (not pure #000)
// Accent: indigo — calm, modern, readable
// Status: muted semantic colours that communicate without screaming

export const C = {
  // Backgrounds: Deep Zinc
  bg:       "#09090b", // zinc-950
  card:     "#18181b80", // zinc-900 at 50% opacity (pseudo-glass)
  elevated: "#27272a", // zinc-800
  input:    "#ffffff08", // 3% white for floating fields
  
  // Borders
  border:      "#ffffff15", // 8% white
  borderFocus: "#6366f1", // indigo-500

  // Primary accent — indigo
  accent:    "#6366f1",
  accentSoft:"#6366f120",
  accentDim: "#4f46e5", // indigo-600

  // Status colours — vibrant but grounded
  success: "#10b981",   // emerald-500
  warning: "#f59e0b",   // amber-500
  danger:  "#ef4444",   // red-500
  info:    "#3b82f6",   // blue-500
  purple:  "#8b5cf6",   // violet-500

  // Text
  textPrimary:   "#f8fafc", // slate-50
  textSecondary: "#94a3b8", // slate-400
  textMuted:     "#64748b", // slate-500
};

export const S = {
  xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const R = {
  sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, full: 9999,
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
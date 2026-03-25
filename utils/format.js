// ⏱ Convert minutes → "1h 20m"
export const fmtMinutes = (mins) => {
  if (!mins && mins !== 0) return "—";

  const m = Math.round(mins);

  if (m < 60) return `${m}m`;

  return `${Math.floor(m / 60)}h ${m % 60}m`;
};


// ⏱ Live timer → "MM:SS"
export const fmtElapsed = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};


// 📅 Format date
export const fmtDate = (iso) => {
  if (!iso) return "—";

  return new Date(iso).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};


// 📊 Risk label
export const riskLabel = (risk) => {
  if (risk >= 70) return "HIGH";
  if (risk >= 40) return "MEDIUM";
  return "LOW";
};
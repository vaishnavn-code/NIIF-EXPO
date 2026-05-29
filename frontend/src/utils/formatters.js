/**
 * All display-formatting helpers.
 * Values are always in raw INR from the API; these convert to display units.
 */

export const fmt = {
  /** ₹ 1,234.56 Bn  (raw value in INR) */
  bn: (v, decimals = 2) =>
    `₹${(v / 1e9).toFixed(decimals)} Bn`,

  /** ₹ 1,234.56 Cr  (raw value in INR) */
 cr: (v) => {
  const val = (v || 0) / 1e7;

  return val < 1
    ? `₹${val.toFixed(2)} Cr`   // show decimals for small values
    : `₹${Math.round(val).toLocaleString("en-IN")} Cr`;
},

  /** ₹ 1,234.56 Mn */
  mn: (v, decimals = 2) =>
    `₹${(v / 1e6).toFixed(decimals)} Mn`,

  /** Auto-pick Bn / Mn / raw */
  auto: (v) => {
    const abs = Math.abs(v)
    if (abs >= 1e9) return `₹${(v / 1e9).toFixed(2)} Bn`
    if (abs >= 1e6) return `₹${(v / 1e6).toFixed(2)} Mn`
    return `₹${v.toLocaleString('en-IN')}`
  },

  /** 8.25 → "8.25%" */
  pct: (v, decimals = 2) => `${parseFloat(v).toFixed(decimals)}%`,

  /** 14.5 → "14.5 yrs" */
  tenor: (v) => `${v} yrs`,

  /** Already in Bn from API */
  bnRaw: (v, decimals = 2) => `₹${parseFloat(v).toFixed(decimals)} Bn`,

  /** Already in Mn from API */
  mnRaw: (v, decimals = 2) => `₹${parseFloat(v).toFixed(decimals)} Mn`,

  /** Integer with commas */
  int: (v) => Number(v).toLocaleString('en-IN'),

  /** Clamp a percentage 0–100 */
  spark: (v) => `${Math.min(100, Math.max(0, v)).toFixed(1)}%`,
}

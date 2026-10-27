import type { Cents } from "@/types/api";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dollars = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "$1,500.00" for 150000. The backend stores every amount as integer cents. */
export function formatMoney(cents: Cents) {
  return usd.format(cents / 100);
}

/** "1,500.00" for 150000: the amount as it reads inside a field with a "$" prefix. */
export function formatDollars(cents: Cents) {
  return dollars.format(cents / 100);
}

// Whole dollars with or without thousands commas, then up to two decimals.
const DOLLAR_AMOUNT = /^(\d{1,3}(?:,\d{3})+|\d*)(?:\.(\d{0,2}))?$/;

/**
 * Typed dollars to integer cents through string parsing, never float multiplication:
 * "1,250.5" → 125050. Accepts a leading "$" and surrounding spaces. Returns null for
 * anything else, including negatives, more than two decimals, and stray commas.
 */
export function parseDollarsToCents(input: string): Cents | null {
  const text = input.trim().replace(/^\$\s*/, "");
  const match = DOLLAR_AMOUNT.exec(text);
  if (!match) return null;

  const whole = (match[1] ?? "").replaceAll(",", "");
  const fraction = match[2] ?? "";
  if (!whole && !fraction) return null;

  return Number(whole || "0") * 100 + Number(fraction.padEnd(2, "0"));
}

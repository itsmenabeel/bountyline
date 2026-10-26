import type { Cents } from "@/types/api";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** "$1,500.00" for 150000. The backend stores every amount as integer cents. */
export function formatMoney(cents: Cents) {
  return usd.format(cents / 100);
}

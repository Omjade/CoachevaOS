/** Formats an amount using the coach's own declared currency (Intl.NumberFormat
 * handles the correct symbol/grouping for any ISO code — $ /₹/€ etc.), never a
 * hardcoded "$". Falls back gracefully if the code is somehow invalid. */
export function formatMoney(amount: number, currencyCode: string | null | undefined): string {
  const code = (currencyCode || "usd").toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

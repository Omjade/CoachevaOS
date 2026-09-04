export interface CurrencyOption {
  code: string;
  label: string;
}

// A curated set of common currencies, not the full ISO 4217 list — matches
// this app's actual coach base far better than an exhaustive 180-entry
// dropdown would. formatMoney() (lib/currency.ts) works with any valid ISO
// code regardless, so this list is just what's offered in the UI.
export const CURRENCIES: CurrencyOption[] = [
  { code: "usd", label: "US Dollar (USD)" },
  { code: "eur", label: "Euro (EUR)" },
  { code: "gbp", label: "British Pound (GBP)" },
  { code: "inr", label: "Indian Rupee (INR)" },
  { code: "cad", label: "Canadian Dollar (CAD)" },
  { code: "aud", label: "Australian Dollar (AUD)" },
  { code: "nzd", label: "New Zealand Dollar (NZD)" },
  { code: "sgd", label: "Singapore Dollar (SGD)" },
  { code: "aed", label: "UAE Dirham (AED)" },
  { code: "zar", label: "South African Rand (ZAR)" },
  { code: "chf", label: "Swiss Franc (CHF)" },
  { code: "jpy", label: "Japanese Yen (JPY)" },
];

export function currencyLabel(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.label ?? code.toUpperCase();
}

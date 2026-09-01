// Shared consent state read/write — CookieConsent.tsx writes it, Analytics.tsx
// reads it. A custom window event lets Analytics react immediately when the
// visitor accepts, without needing a page reload (it may have already
// mounted before the visitor makes a choice).
export type ConsentValue = "accepted" | "declined";

const STORAGE_KEY = "cookie-consent";
const EVENT_NAME = "cookie-consent-changed";

export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "accepted" || value === "declined" ? value : null;
}

export function setConsent(value: ConsentValue) {
  localStorage.setItem(STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: value }));
}

export function onConsentChange(callback: (value: ConsentValue) => void): () => void {
  function handler(e: Event) {
    callback((e as CustomEvent<ConsentValue>).detail);
  }
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

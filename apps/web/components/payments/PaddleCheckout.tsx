import { initializePaddle, type Paddle, type Environments } from "@paddle/paddle-js";

// Cache the initialized instance per (token, environment, customer) triple —
// the backend hands these back per checkout-token request rather than baking
// them into frontend env vars, so this avoids re-initializing Paddle.js on
// every call with the same credentials while still tolerating a config or
// customer-id change (e.g. a fresh sign-in as a different coach).
let cached: { key: string; paddle: Paddle } | null = null;

async function getPaddle(
  clientSideToken: string,
  environment: string,
  // The signed-in coach's real Paddle customer id (ctm_...), when they have
  // one — feeds Paddle Retain's dunning/recovery features. Never a value
  // other than a genuine Paddle customer id: not our own internal user id,
  // not an email. Omitted entirely for a customer who has never checked out
  // yet, since there's nothing for Retain to recover for them.
  paddleCustomerId?: string | null
): Promise<Paddle> {
  const key = `${environment}:${clientSideToken}:${paddleCustomerId ?? ""}`;
  if (cached && cached.key === key) return cached.paddle;

  const paddle = await initializePaddle({
    token: clientSideToken,
    environment: environment as Environments,
    ...(paddleCustomerId ? { pwCustomer: { id: paddleCustomerId } } : {}),
  });
  if (!paddle) throw new Error("Paddle.js failed to initialize");

  cached = { key, paddle };
  return paddle;
}

export async function previewPrice(
  clientSideToken: string,
  environment: string,
  priceId: string,
  countryCode?: string,
  paddleCustomerId?: string | null
): Promise<string | null> {
  const paddle = await getPaddle(clientSideToken, environment, paddleCustomerId);
  const preview = await paddle.PricePreview({
    items: [{ priceId, quantity: 1 }],
    // Omit address entirely when we don't have a country — Paddle.PricePreview()
    // auto-detects location from the visitor's IP in that case. Never pass an
    // internal "unknown" sentinel here.
    ...(countryCode ? { address: { countryCode } } : {}),
  });
  const lineItem = preview.data.details.lineItems[0];
  return lineItem?.formattedTotals?.total ?? null;
}

export async function openPaddleCheckout(options: {
  clientSideToken: string;
  environment: string;
  priceId: string;
  customerEmail: string;
  customData: Record<string, string>;
  successUrl: string;
  // Pre-filling this (e.g. "IN") skips Paddle's own country-selection step
  // and immediately shows localized pricing + payment methods (UPI only
  // ever appears for an India address on an India-priced item) — purely a
  // UX shortcut, never required, Paddle lets the buyer pick/change it anyway.
  countryCode?: string;
  // The signed-in coach's real Paddle customer id, when one exists yet —
  // see getPaddle()'s own doc comment for why this is never anything else.
  paddleCustomerId?: string | null;
}): Promise<void> {
  const paddle = await getPaddle(options.clientSideToken, options.environment, options.paddleCustomerId);
  paddle.Checkout.open({
    items: [{ priceId: options.priceId, quantity: 1 }],
    customer: {
      email: options.customerEmail,
      ...(options.countryCode ? { address: { countryCode: options.countryCode } } : {}),
    },
    customData: options.customData,
    settings: {
      displayMode: "overlay",
      variant: "one-page",
      successUrl: options.successUrl,
    },
  });
}

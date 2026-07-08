// Stripe client + the tier -> price ID mapping. Uses the official SDK here
// (unlike Anthropic/Resend, which are simple flat JSON APIs called via raw
// fetch) because Stripe's REST API uses form-encoded bodies with deep
// bracket-notation nesting, and webhook signature verification needs exact
// HMAC handling — correctness matters more than avoiding one more
// dependency when the code is moving real money.
import Stripe from "stripe";

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured. Add it to .env.local to enable billing.");
  }
  return new Stripe(secretKey);
}

// Tier 3 (Large/IOC-adjacent) is deliberately not here — it's a custom,
// negotiated price, never self-serve checkout (matches the pricing page).
export const TIER_PRICE_ENV_VARS = {
  micro: "STRIPE_PRICE_TIER1",
  mid: "STRIPE_PRICE_TIER2",
} as const;

export type SelfServeTier = keyof typeof TIER_PRICE_ENV_VARS;

export function getPriceIdForTier(tier: SelfServeTier): string {
  const envVar = TIER_PRICE_ENV_VARS[tier];
  const priceId = process.env[envVar];
  if (!priceId) {
    throw new Error(`${envVar} is not configured. Add it to .env.local to enable checkout for this tier.`);
  }
  return priceId;
}

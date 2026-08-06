import Stripe from "stripe";

/**
 * Server-side Stripe client. Never import this from a Client Component —
 * it reads the secret key, which only exists in the Node.js runtime.
 *
 * The API version is intentionally omitted so the SDK uses the version it was
 * built against, which is the one its TypeScript types describe.
 */
let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Copy env.example to .env.local and fill in your Stripe keys."
    );
  }

  cached = new Stripe(secretKey, {
    typescript: true,
    maxNetworkRetries: 2,
    appInfo: { name: "Traveloop", url: "https://traveloop.my" },
  });

  return cached;
}

/**
 * Absolute base URL used to build Stripe return URLs.
 *
 * Read from configuration rather than the request's Host/Origin header: those
 * are attacker-controlled, and feeding them into `success_url` would let a
 * forged Host bounce a real buyer to another site after payment.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;

  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";

  throw new Error(
    "NEXT_PUBLIC_SITE_URL must be set in production so Stripe can redirect buyers back to the site."
  );
}

/** True when the site URL is publicly reachable, so Stripe can fetch product images from it. */
export function siteIsPubliclyReachable(): boolean {
  const url = getSiteUrl();
  return !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(url);
}

/**
 * True when checkout should skip Stripe entirely and fulfil the order
 * directly, so the buyer flow can be tested before real Stripe keys exist.
 *
 * Opt in explicitly with PAYMENTS_TEST_MODE=true, or it activates itself
 * whenever STRIPE_SECRET_KEY is missing outside production — never in
 * production, even if the key was left unset by mistake.
 */
export function isPaymentsBypassEnabled(): boolean {
  if (process.env.PAYMENTS_TEST_MODE === "true") return true;
  if (process.env.PAYMENTS_TEST_MODE === "false") return false;

  const key = process.env.STRIPE_SECRET_KEY;
  const looksConfigured = !!key && !key.includes("replace_me");
  return !looksConfigured && process.env.NODE_ENV !== "production";
}

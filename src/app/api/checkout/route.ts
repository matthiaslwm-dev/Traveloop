import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSiteUrl, getStripe, isPaymentsBypassEnabled, siteIsPubliclyReachable } from "@/lib/stripe";
import { PASS_CURRENCY, getPassTier } from "@/app/data/passes";
import { fulfillPassOrder, type PassOrder } from "@/lib/fulfillment";

export const runtime = "nodejs";

const MAX_QUANTITY = 10;

/** Accepts only a whole number of passes within the allowed range; anything else falls back to 1. */
function parseQuantity(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) return 1;
  return Math.min(Math.max(value, 1), MAX_QUANTITY);
}

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Creates a Stripe Checkout Session for a single pass tier and returns its
 * hosted-page URL. The browser sends only a tier key — the price is looked up
 * server-side, so a tampered request can't change what gets charged.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const { passKey, quantity, customer } = (body ?? {}) as {
    passKey?: unknown;
    quantity?: unknown;
    customer?: { name?: unknown; email?: unknown; phone?: unknown };
  };

  const tier = getPassTier(passKey);
  if (!tier) {
    return NextResponse.json({ error: "Unknown pass tier." }, { status: 400 });
  }

  const parsedQuantity = parseQuantity(quantity);
  const customerName = typeof customer?.name === "string" ? customer.name.trim() : "";
  const customerEmail = typeof customer?.email === "string" ? customer.email.trim() : "";
  const customerPhone = typeof customer?.phone === "string" ? customer.phone.trim() : "";

  const siteUrl = getSiteUrl();

  // No real Stripe keys yet (or PAYMENTS_TEST_MODE=true): fulfil the order
  // directly instead of redirecting to Stripe, so the buyer flow — order
  // record, confirmation email, invoice — can be exercised end-to-end.
  if (isPaymentsBypassEnabled()) {
    if (!isValidEmail(customerEmail)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    const order: PassOrder = {
      sessionId: `cs_bypass_${randomUUID()}`,
      passKey: tier.key,
      passName: tier.name,
      quantity: parsedQuantity,
      amountTotal: tier.priceCents * parsedQuantity,
      currency: PASS_CURRENCY,
      customerEmail,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      paymentIntentId: null,
    };

    try {
      await fulfillPassOrder(order);
    } catch (error) {
      console.error("[checkout] Bypass fulfilment failed:", error);
      return NextResponse.json(
        { error: "We couldn't complete your test order. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: `${siteUrl}/passes/success?session_id=${order.sessionId}`,
    });
  }

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      submit_type: "pay",
      locale: "auto",
      ...(isValidEmail(customerEmail) ? { customer_email: customerEmail } : {}),
      line_items: [
        {
          quantity: parsedQuantity,
          adjustable_quantity: { enabled: true, minimum: 1, maximum: MAX_QUANTITY },
          price_data: {
            currency: PASS_CURRENCY,
            unit_amount: tier.priceCents,
            product_data: {
              name: `Traveloop ${tier.name} Pass`,
              description: tier.highlights.join(" · ").slice(0, 500),
              // Stripe fetches this itself, so only send it when the host is reachable.
              ...(siteIsPubliclyReachable()
                ? { images: [`${siteUrl}/traveloop-logo.webp`] }
                : {}),
            },
          },
        },
      ],
      // Carried through to the webhook, which is where fulfilment happens.
      metadata: { passKey: tier.key, passName: tier.name },
      payment_intent_data: {
        metadata: { passKey: tier.key, passName: tier.name },
        description: `Traveloop ${tier.name} Pass`,
      },
      billing_address_collection: "auto",
      phone_number_collection: { enabled: true },
      success_url: `${siteUrl}/passes/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/passes?checkout=cancelled#pricing`,
    });

    if (!session.url) {
      throw new Error("Stripe returned a session without a checkout URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // Log the detail server-side; return something safe to show a buyer.
    console.error("[checkout] Failed to create Stripe Checkout Session:", error);

    const isConfigError =
      error instanceof Stripe.errors.StripeAuthenticationError ||
      (error instanceof Error && error.message.includes("STRIPE_SECRET_KEY"));

    return NextResponse.json(
      {
        error: isConfigError
          ? "Payments aren't configured yet. Please contact us to complete your purchase."
          : "We couldn't start checkout. Please try again in a moment.",
      },
      { status: isConfigError ? 503 : 500 }
    );
  }
}

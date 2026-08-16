import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSiteUrl, getStripe, isPaymentsBypassEnabled, siteIsPubliclyReachable } from "@/lib/stripe";
import { PASS_CURRENCY, getPassTier } from "@/app/data/passes";
import { fulfillPassOrder, type PassOrder, type PassOrderItem } from "@/lib/fulfillment";
import { parseRegistration } from "@/lib/registration";
import { insertCheckoutDraft, type DraftItem } from "@/lib/checkout-drafts-db";

export const runtime = "nodejs";

const MAX_ITEMS = 20;

/**
 * Creates a Stripe Checkout Session for a cart of one or more passes and
 * returns its hosted-page URL. The browser sends only tier keys — prices are
 * looked up server-side, so a tampered request can't change what gets
 * charged. Tiers can be mixed in one cart (e.g. 2 Gold + 3 Silver).
 *
 * Each pass needs its own tourist-registration/insurance details. Those are
 * too large (and too many, for a big cart) to fit in Stripe's metadata, so
 * they're written to a short-lived `checkout_drafts` row instead and only its
 * id rides in session metadata. An abandoned checkout leaves that draft row
 * behind but nothing else — no order, no registration.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const { items: rawItems } = (body ?? {}) as { items?: unknown };

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }
  if (rawItems.length > MAX_ITEMS) {
    return NextResponse.json({ error: `A single order can include at most ${MAX_ITEMS} passes.` }, { status: 400 });
  }

  const items: DraftItem[] = [];
  for (const raw of rawItems) {
    const { passKey, registration } = (raw ?? {}) as { passKey?: unknown; registration?: unknown };

    const tier = getPassTier(passKey);
    if (!tier) {
      return NextResponse.json({ error: "Unknown pass tier." }, { status: 400 });
    }

    const parsed = parseRegistration(registration);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    items.push({
      passKey: tier.key,
      passName: tier.name,
      unitAmountCents: tier.priceCents,
      registration: parsed.value,
    });
  }

  const siteUrl = getSiteUrl();

  // No real Stripe keys yet (or PAYMENTS_TEST_MODE=true): fulfil the order
  // directly instead of redirecting to Stripe, so the buyer flow — order
  // record, confirmation email, invoice — can be exercised end-to-end.
  if (isPaymentsBypassEnabled()) {
    // The form no longer collects an email — Stripe does — so the bypass
    // needs one from the environment to exercise account creation locally.
    const order: PassOrder = {
      sessionId: `cs_bypass_${randomUUID()}`,
      draftId: null,
      items,
      amountTotal: items.reduce((sum, item) => sum + item.unitAmountCents, 0),
      currency: PASS_CURRENCY,
      customerEmail: process.env.PAYMENTS_TEST_EMAIL ?? "test@example.com",
      customerName: items[0].registration.fullName,
      customerPhone: null,
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
    const draftId = await insertCheckoutDraft(items);

    const lineItems = buildLineItems(items, siteUrl);

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      submit_type: "pay",
      locale: "auto",
      line_items: lineItems,
      // Carried through to the webhook, which is where fulfilment happens.
      metadata: { draftId },
      payment_intent_data: {
        metadata: { draftId },
        description: describeCart(items),
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

/** One Stripe line item per distinct tier in the cart, quantity = how many of that tier. */
function buildLineItems(
  items: PassOrderItem[],
  siteUrl: string
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const byTier = new Map<string, { item: PassOrderItem; quantity: number }>();

  for (const item of items) {
    const existing = byTier.get(item.passKey);
    if (existing) {
      existing.quantity += 1;
    } else {
      byTier.set(item.passKey, { item, quantity: 1 });
    }
  }

  const tier = (key: string) => getPassTier(key);

  return Array.from(byTier.values()).map(({ item, quantity }) => ({
    quantity,
    price_data: {
      currency: PASS_CURRENCY,
      unit_amount: item.unitAmountCents,
      product_data: {
        name: `Traveloop ${item.passName} Pass`,
        description: tier(item.passKey)?.highlights.join(" · ").slice(0, 500),
        // Stripe fetches this itself, so only send it when the host is reachable.
        ...(siteIsPubliclyReachable() ? { images: [`${siteUrl}/traveloop-logo.webp`] } : {}),
      },
    },
  }));
}

function describeCart(items: DraftItem[]): string {
  if (items.length === 1) return `Traveloop ${items[0].passName} Pass`;
  return `${items.length} Traveloop Passes`;
}

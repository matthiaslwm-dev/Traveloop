import type Stripe from "stripe";
import { insertOrderIfNew } from "./orders-db";
import { sendOrderConfirmationEmail } from "./email";

export type PassOrder = {
  /** Stripe Checkout Session id — the natural idempotency key for an order. */
  sessionId: string;
  passKey: string;
  passName: string;
  quantity: number;
  /** Total actually captured, in the smallest currency unit. */
  amountTotal: number;
  currency: string;
  customerEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  paymentIntentId: string | null;
};

/** Pulls the fields we care about out of a completed Checkout Session. */
export function toPassOrder(session: Stripe.Checkout.Session): PassOrder {
  const details = session.customer_details;

  return {
    sessionId: session.id,
    passKey: session.metadata?.passKey ?? "unknown",
    passName: session.metadata?.passName ?? "unknown",
    // `line_items` is only present when expanded at retrieval time.
    quantity: session.line_items?.data[0]?.quantity ?? 1,
    amountTotal: session.amount_total ?? 0,
    currency: session.currency ?? "myr",
    customerEmail: details?.email ?? session.customer_email ?? null,
    customerName: details?.name ?? null,
    customerPhone: details?.phone ?? null,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null),
  };
}

/**
 * The single place where a paid order turns into a delivered pass.
 *
 * Stripe retries webhooks and can deliver the same event more than once, so
 * this is idempotent on `sessionId`: `insertOrderIfNew` only reports
 * `inserted: true` the first time, and everything with a side effect (email)
 * is gated on that.
 *
 * TODO: issue the actual pass number / QR code the buyer redeems at partner
 * locations — right now buyers get a receipt + invoice but no redeemable pass.
 */
export async function fulfillPassOrder(order: PassOrder): Promise<void> {
  const { inserted, stored } = await insertOrderIfNew(order);

  if (!inserted) {
    console.info(`[fulfillment] Order ${order.sessionId} already fulfilled — skipping.`);
    return;
  }

  console.info("[fulfillment] Pass purchased:", {
    sessionId: stored.sessionId,
    invoiceNumber: stored.invoiceNumber,
    pass: stored.passName,
    quantity: stored.quantity,
    total: `${stored.currency.toUpperCase()} ${(stored.amountTotal / 100).toFixed(2)}`,
    email: stored.customerEmail,
    phone: stored.customerPhone,
  });

  await sendOrderConfirmationEmail(stored);
}

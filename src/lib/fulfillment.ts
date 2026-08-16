import type Stripe from "stripe";
import { insertOrderIfNew } from "./orders-db";
import { sendOrderConfirmationEmail, sendAccountWelcomeEmail } from "./email";
import { findOrCreateCustomerAccount } from "./customer-account";
import { upsertCustomerProfile } from "./customer-profile-db";
import { insertPassRegistrations } from "./pass-registrations-db";
import { getCheckoutDraft, deleteCheckoutDraft, type DraftItem } from "./checkout-drafts-db";
import type { PassRegistration } from "./registration";

export type PassOrderItem = DraftItem;

export type PassOrder = {
  /** Stripe Checkout Session id — the natural idempotency key for an order. */
  sessionId: string;
  /** The draft id this order's items came from, if any — deleted once fulfilment finishes with it. */
  draftId: string | null;
  /** One entry per pass purchased; length >= 1. */
  items: PassOrderItem[];
  /** Total actually captured, in the smallest currency unit. */
  amountTotal: number;
  currency: string;
  customerEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  paymentIntentId: string | null;
};

/** Pulls the fields we care about out of a completed Checkout Session, resolving its draft. */
export async function toPassOrder(session: Stripe.Checkout.Session): Promise<PassOrder> {
  const details = session.customer_details;
  const draftId = session.metadata?.draftId ?? null;

  // Null for orders placed before this draft-based flow existed.
  const items = draftId ? await getCheckoutDraft(draftId) : null;

  return {
    sessionId: session.id,
    draftId,
    items: items ?? [],
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

/** The buyer's own registration, used to autofill their portal profile — the first pass in the cart. */
function primaryRegistration(order: PassOrder): PassRegistration | null {
  return order.items[0]?.registration ?? null;
}

/**
 * The single place where a paid order turns into delivered passes.
 *
 * Stripe retries webhooks and can deliver the same event more than once, so
 * this is idempotent on `sessionId`: `insertOrderIfNew` only reports
 * `inserted: true` the first time, and everything with a side effect (email,
 * registration rows) is gated on that.
 *
 * TODO: issue the actual pass number / QR code the buyer redeems at partner
 * locations — right now buyers get a receipt + invoice but no redeemable pass.
 */
export async function fulfillPassOrder(order: PassOrder): Promise<void> {
  const account = order.customerEmail
    ? await findOrCreateCustomerAccount(order.customerEmail, order.customerName)
    : { userId: null, isNew: false as const };

  // Registration details belong to the person, so they're saved even if this
  // webhook turns out to be a duplicate delivery. A failure here must not
  // block the order or its email — the purchase itself is what matters.
  const registration = primaryRegistration(order);
  if (account.userId && registration) {
    try {
      await upsertCustomerProfile(account.userId, registration);
    } catch (error) {
      console.error(`[fulfillment] Failed to save profile for ${order.sessionId}:`, error);
    }
  }

  const { inserted, stored } = await insertOrderIfNew(order, account.userId);

  if (!inserted) {
    console.info(`[fulfillment] Order ${order.sessionId} already fulfilled — skipping.`);
    return;
  }

  if (order.items.length > 0) {
    try {
      await insertPassRegistrations(order.sessionId, account.userId, order.items);
    } catch (error) {
      console.error(`[fulfillment] Failed to save pass registrations for ${order.sessionId}:`, error);
    }
  }

  console.info("[fulfillment] Pass(es) purchased:", {
    sessionId: stored.sessionId,
    invoiceNumber: stored.invoiceNumber,
    quantity: stored.quantity,
    pass: stored.passName,
    total: `${stored.currency.toUpperCase()} ${(stored.amountTotal / 100).toFixed(2)}`,
    email: stored.customerEmail,
    phone: stored.customerPhone,
  });

  if (account.isNew) {
    await sendAccountWelcomeEmail(stored, order.items, account.password);
  } else {
    await sendOrderConfirmationEmail(stored, order.items);
  }

  if (order.draftId) {
    await deleteCheckoutDraft(order.draftId);
  }
}

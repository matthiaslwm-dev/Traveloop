import { Resend } from "resend";
import type { StoredOrder } from "./orders-db";
import { buildInvoiceHtml } from "./invoice";

let cached: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.includes("replace_me")) return null;

  if (!cached) cached = new Resend(apiKey);
  return cached;
}

function confirmationHtml(order: StoredOrder): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #1a1a1a; max-width: 560px; margin: 0 auto;">
      <h1 style="font-size: 20px;">Thanks for your purchase, ${order.customerName?.split(" ")[0] ?? "traveller"}!</h1>
      <p>Your Traveloop <strong>${order.passName} Pass</strong> (x${order.quantity}) is confirmed.</p>
      <p>Total paid: <strong>${order.currency.toUpperCase()} ${(order.amountTotal / 100).toFixed(2)}</strong></p>
      <p>Order reference: <code>${order.sessionId}</code><br/>Invoice: <code>${order.invoiceNumber}</code></p>
      <p>Your invoice is attached to this email. Quote your order reference if you contact us.</p>
    </div>
  `;
}

/**
 * Sends the buyer their receipt + invoice.
 *
 * Falls back to logging the full email to the console when RESEND_API_KEY
 * isn't set, so the checkout flow can be exercised end-to-end without an
 * email provider account.
 */
export async function sendOrderConfirmationEmail(order: StoredOrder): Promise<void> {
  const invoiceHtml = buildInvoiceHtml(order);
  const resend = getResend();

  if (!resend) {
    console.info("[email] RESEND_API_KEY not set — logging email instead of sending:", {
      to: order.customerEmail,
      subject: `Your Traveloop ${order.passName} Pass — ${order.invoiceNumber}`,
      invoiceNumber: order.invoiceNumber,
    });
    return;
  }

  if (!order.customerEmail) {
    console.warn(`[email] Order ${order.sessionId} has no customer email — skipping send.`);
    return;
  }

  const from = process.env.EMAIL_FROM ?? "Traveloop <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to: order.customerEmail,
    subject: `Your Traveloop ${order.passName} Pass — ${order.invoiceNumber}`,
    html: confirmationHtml(order),
    attachments: [
      {
        filename: `${order.invoiceNumber}.html`,
        content: Buffer.from(invoiceHtml).toString("base64"),
      },
    ],
  });

  if (error) {
    // Fulfilment must not fail because the email provider hiccupped — the
    // order is already recorded, and the invoice is viewable via its own route.
    console.error(`[email] Failed to send confirmation for ${order.sessionId}:`, error);
  }
}

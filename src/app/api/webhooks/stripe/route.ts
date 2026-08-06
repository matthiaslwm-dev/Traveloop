import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { fulfillPassOrder, toPassOrder } from "@/lib/fulfillment";

export const runtime = "nodejs";

/**
 * Stripe webhook endpoint.
 *
 * Payment is confirmed here, not on the success page — a buyer can close the
 * tab before being redirected back, and Malaysian methods like FPX settle
 * asynchronously minutes after checkout is submitted.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  // Must be the raw, unparsed body — the signature covers the exact bytes sent.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(payload, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe-webhook] Signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        // Delayed-notification methods arrive here still unpaid; those are
        // fulfilled by async_payment_succeeded instead.
        if (session.payment_status === "paid") {
          await fulfillCompletedSession(session.id);
        } else {
          console.info(
            `[stripe-webhook] Session ${session.id} completed but is ${session.payment_status}; awaiting settlement.`
          );
        }
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        await fulfillCompletedSession(event.data.object.id);
        break;
      }

      case "checkout.session.async_payment_failed": {
        console.warn(
          `[stripe-webhook] Delayed payment failed for session ${event.data.object.id}.`
        );
        break;
      }

      default:
        break;
    }
  } catch (error) {
    // A non-2xx tells Stripe to retry, which is what we want if fulfilment broke.
    console.error(`[stripe-webhook] Failed handling ${event.type}:`, error);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/** Re-reads the session with line items expanded, then hands it to fulfilment. */
async function fulfillCompletedSession(sessionId: string): Promise<void> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  });

  await fulfillPassOrder(toPassOrder(session));
}

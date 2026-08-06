import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Icon } from "../../components/Icons";
import { getStripe } from "@/lib/stripe";
import { toPassOrder, type PassOrder } from "@/lib/fulfillment";
import { getOrderBySessionId } from "@/lib/orders-db";

export const metadata: Metadata = {
  title: "Order confirmed — Traveloop",
  robots: { index: false, follow: false },
};

type SuccessPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type OrderState =
  | { kind: "paid"; order: PassOrder }
  | { kind: "processing"; order: PassOrder }
  | { kind: "unavailable" };

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const sessionId = (await searchParams).session_id;

  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    redirect("/passes");
  }

  const state = await loadOrder(sessionId);

  return (
    <>
      <Navbar forceScrolled />
      <main>
        <section className="passes-section section-light checkout-result">
          {state.kind === "unavailable" ? (
            <UnavailableState />
          ) : (
            <ConfirmedState state={state} />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

async function loadOrder(sessionId: string): Promise<OrderState> {
  // Bypass-mode orders never touch Stripe — fulfilment already ran synchronously
  // in the checkout route, so the local order record is authoritative here.
  if (sessionId.startsWith("cs_bypass_")) {
    const stored = await getOrderBySessionId(sessionId);
    return stored ? { kind: "paid", order: stored } : { kind: "unavailable" };
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    const order = toPassOrder(session);

    // `paid` is the only state that means money has actually settled. FPX and
    // other delayed methods sit at `unpaid` until the bank confirms.
    return session.payment_status === "paid"
      ? { kind: "paid", order }
      : { kind: "processing", order };
  } catch (error) {
    console.error("[checkout-success] Could not retrieve session:", error);
    return { kind: "unavailable" };
  }
}

function ConfirmedState({ state }: { state: Extract<OrderState, { kind: "paid" | "processing" }> }) {
  const { order } = state;
  const isPaid = state.kind === "paid";

  return (
    <div className="checkout-result-card">
      <span className={`checkout-result-icon${isPaid ? "" : " pending"}`}>
        <Icon name={isPaid ? "shield" : "clock"} />
      </span>

      <p className="eyebrow">{isPaid ? "Order confirmed" : "Payment processing"}</p>
      <h1>
        {isPaid ? (
          <>
            Welcome aboard,
            <br />
            <em>{order.customerName?.split(" ")[0] ?? "traveller"}.</em>
          </>
        ) : (
          <>
            Almost there —
            <br />
            <em>confirming your payment.</em>
          </>
        )}
      </h1>

      <p className="checkout-result-lede">
        {isPaid ? (
          <>
            Your {order.passName} Pass is confirmed. We&apos;ve sent a receipt
            {order.customerEmail ? ` to ${order.customerEmail}` : ""}, and your pass details will
            follow by email shortly.
          </>
        ) : (
          <>
            Your bank hasn&apos;t confirmed the transfer yet — this can take a few minutes. We&apos;ll
            email you
            {order.customerEmail ? ` at ${order.customerEmail}` : ""} as soon as it clears. There&apos;s
            no need to pay again.
          </>
        )}
      </p>

      <dl className="checkout-summary">
        <div>
          <dt>Pass</dt>
          <dd>{order.passName}</dd>
        </div>
        <div>
          <dt>Quantity</dt>
          <dd>{order.quantity}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>
            {order.currency.toUpperCase()} {(order.amountTotal / 100).toFixed(2)}
          </dd>
        </div>
        <div>
          <dt>Order reference</dt>
          <dd className="checkout-summary-ref">{order.sessionId}</dd>
        </div>
      </dl>

      <div className="checkout-result-actions">
        <Link className="button primary" href="/passes">
          Back to passes
        </Link>
        {isPaid && (
          <Link
            className="button ghost dark"
            href={`/api/orders/${order.sessionId}/invoice`}
            target="_blank"
          >
            View invoice
          </Link>
        )}
        <Link className="button ghost dark" href="/contact">
          Need help?
        </Link>
      </div>

      <p className="checkout-result-note">
        Quote your order reference if you contact us about this purchase.
      </p>
    </div>
  );
}

function UnavailableState() {
  return (
    <div className="checkout-result-card">
      <span className="checkout-result-icon pending">
        <Icon name="clock" />
      </span>
      <p className="eyebrow">Order status unavailable</p>
      <h1>
        We couldn&apos;t load
        <br />
        <em>this order.</em>
      </h1>
      <p className="checkout-result-lede">
        If you completed payment, don&apos;t worry — it has still gone through, and your receipt is on
        its way by email. Get in touch and we&apos;ll confirm the details for you.
      </p>
      <div className="checkout-result-actions">
        <Link className="button primary" href="/contact">
          Contact us
        </Link>
        <Link className="button ghost dark" href="/passes">
          Back to passes
        </Link>
      </div>
    </div>
  );
}

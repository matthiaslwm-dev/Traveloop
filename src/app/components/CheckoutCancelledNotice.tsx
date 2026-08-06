"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Shown when Stripe returns a buyer to /passes?checkout=cancelled.
 *
 * Must be rendered inside a <Suspense> boundary: useSearchParams makes this
 * subtree client-rendered, and the boundary keeps the rest of the page static.
 */
export default function CheckoutCancelledNotice() {
  const wasCancelled = useSearchParams().get("checkout") === "cancelled";
  const [dismissed, setDismissed] = useState(false);

  if (!wasCancelled || dismissed) return null;

  return (
    <div className="checkout-cancelled" role="status">
      <span>
        Checkout was cancelled — you haven&apos;t been charged. Pick a pass below whenever
        you&apos;re ready.
      </span>
      <button
        type="button"
        className="checkout-cancelled-close"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
      >
        ×
      </button>
    </div>
  );
}

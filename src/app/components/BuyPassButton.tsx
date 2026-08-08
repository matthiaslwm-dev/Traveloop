"use client";

import { useState } from "react";
import type { PassKey } from "../data/passes";

type BuyPassButtonProps = {
  passKey: PassKey;
  /** Matches the CTA styling already used at the call site (e.g. "button primary"). */
  className?: string;
  children: React.ReactNode;
};

/** Starts Stripe Checkout for one pass tier. Stripe's hosted page collects the buyer's email itself. */
export default function BuyPassButton({ passKey, className = "", children }: BuyPassButtonProps) {
  const [status, setStatus] = useState<"idle" | "redirecting">("idle");
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (status === "redirecting") return;

    setStatus("redirecting");
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passKey }),
      });

      const data: { url?: string; error?: string } = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        setError(data.error ?? "We couldn't start checkout. Please try again.");
        setStatus("idle");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Network error. Please check your connection and try again.");
      setStatus("idle");
    }
  }

  return (
    <div className="checkout-button-wrap">
      <button
        type="button"
        className={`${className} checkout-button`.trim()}
        onClick={startCheckout}
        disabled={status === "redirecting"}
        aria-busy={status === "redirecting"}
      >
        {status === "redirecting" ? (
          <>
            <span className="checkout-spinner" aria-hidden="true" />
            Redirecting…
          </>
        ) : (
          children
        )}
      </button>
      {error && (
        <p className="checkout-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

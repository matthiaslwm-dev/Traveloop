"use client";

import { useState } from "react";
import type { PassKey } from "../data/passes";

type BuyPassButtonProps = {
  passKey: PassKey;
  /** Matches the CTA styling already used at the call site (e.g. "button primary"). */
  className?: string;
  children: React.ReactNode;
};

/**
 * Starts checkout for one pass tier.
 *
 * Collects the buyer's name/email inline first: Stripe's hosted page would
 * normally gather this, but it's also needed up front for the payments
 * bypass (test) path, where there's no hosted page to collect it on.
 */
export default function BuyPassButton({ passKey, className = "", children }: BuyPassButtonProps) {
  const [status, setStatus] = useState<"idle" | "collecting" | "redirecting">("idle");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  async function startCheckout(event: React.FormEvent) {
    event.preventDefault();
    if (status === "redirecting") return;

    setStatus("redirecting");
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passKey, customer: { name, email } }),
      });

      const data: { url?: string; error?: string } = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        setError(data.error ?? "We couldn't start checkout. Please try again.");
        setStatus("collecting");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Network error. Please check your connection and try again.");
      setStatus("collecting");
    }
  }

  if (status === "idle") {
    return (
      <button
        type="button"
        className={`${className} checkout-button`.trim()}
        onClick={() => setStatus("collecting")}
      >
        {children}
      </button>
    );
  }

  return (
    <form className="checkout-inline-form" onSubmit={startCheckout}>
      <div className="form-row">
        <label className="form-field">
          Full name
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="form-field">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
      </div>
      <div className="checkout-inline-form-actions">
        <button
          type="submit"
          className={`${className} checkout-button`.trim()}
          disabled={status === "redirecting"}
          aria-busy={status === "redirecting"}
        >
          {status === "redirecting" ? (
            <>
              <span className="checkout-spinner" aria-hidden="true" />
              Redirecting…
            </>
          ) : (
            "Continue"
          )}
        </button>
        <button
          type="button"
          className="button ghost dark"
          onClick={() => setStatus("idle")}
          disabled={status === "redirecting"}
        >
          Cancel
        </button>
      </div>
      {error && (
        <p className="checkout-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

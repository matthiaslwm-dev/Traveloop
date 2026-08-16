"use client";

import { useState } from "react";
import type { PassKey, PassTier } from "@/app/data/passes";
import {
  NATIONALITIES,
  DOCUMENT_TYPES,
  EMERGENCY_RELATIONSHIPS,
} from "@/lib/registration";
import InsuranceTerms from "@/app/components/InsuranceTerms";

type RegistrationFormProps = {
  passTiers: PassTier[];
  seedPassKey?: PassKey;
};

type CartItem = {
  id: string;
  passKey: PassKey;
};

type Fields = {
  fullName: string;
  nationality: string;
  otherNationality: string;
  arrivalDate: string;
  departureDate: string;
  travelDocumentType: string;
  travelDocumentNumber: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  otherRelationship: string;
};

const EMPTY: Fields = {
  fullName: "",
  nationality: "",
  otherNationality: "",
  arrivalDate: "",
  departureDate: "",
  travelDocumentType: "",
  travelDocumentNumber: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelationship: "",
  otherRelationship: "",
};

function newCartItem(passKey: PassKey): CartItem {
  return { id: crypto.randomUUID(), passKey };
}

/**
 * Three-step purchase flow: build a cart of one or more passes, fill in a
 * tourist registration for each one, then a single Terms & Conditions
 * declaration covering the whole order. Only after that does the browser hit
 * /api/checkout and get redirected to Stripe, which is where email and phone
 * are collected.
 *
 * Nothing is persisted between steps — everything rides in component state
 * and is posted in one go at the end.
 */
export default function RegistrationForm({ passTiers, seedPassKey }: RegistrationFormProps) {
  const [cart, setCart] = useState<CartItem[]>(seedPassKey ? [newCartItem(seedPassKey)] : []);
  const [step, setStep] = useState<"cart" | "details" | "terms">("cart");
  const [activeIndex, setActiveIndex] = useState(0);
  const [registrations, setRegistrations] = useState<Record<string, Fields>>({});
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState<"idle" | "redirecting">("idle");
  const [error, setError] = useState<string | null>(null);

  function tierFor(passKey: PassKey): PassTier {
    return passTiers.find((t) => t.key === passKey)!;
  }

  function addToCart(passKey: PassKey) {
    setCart((prev) => [...prev, newCartItem(passKey)]);
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((item) => item.id !== id));
    setRegistrations((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function fieldsFor(id: string): Fields {
    return registrations[id] ?? EMPTY;
  }

  function setField<K extends keyof Fields>(id: string, key: K, value: Fields[K]) {
    setRegistrations((prev) => ({ ...prev, [id]: { ...fieldsFor(id), [key]: value } }));
  }

  function startDetails() {
    if (cart.length === 0) return;
    setActiveIndex(0);
    setStep("details");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToNextRegistrant(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const fields = fieldsFor(cart[activeIndex].id);
    if (Date.parse(fields.departureDate) < Date.parse(fields.arrivalDate)) {
      setError("Your departure date must be on or after your arrival date.");
      return;
    }

    if (activeIndex < cart.length - 1) {
      setActiveIndex((i) => i + 1);
    } else {
      setStep("terms");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBackFromDetails() {
    if (activeIndex > 0) {
      setActiveIndex((i) => i - 1);
    } else {
      setStep("cart");
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (status === "redirecting") return;

    setStatus("redirecting");
    setError(null);

    const items = cart.map((item) => {
      const fields = fieldsFor(item.id);
      // "Other" is a prompt for free text, not a value worth storing.
      const nationality = fields.nationality === "Other" ? fields.otherNationality.trim() : fields.nationality;
      const relationship =
        fields.emergencyContactRelationship === "Other"
          ? fields.otherRelationship.trim()
          : fields.emergencyContactRelationship;

      return {
        passKey: item.passKey,
        registration: {
          fullName: fields.fullName,
          nationality,
          arrivalDate: fields.arrivalDate,
          departureDate: fields.departureDate,
          travelDocumentType: fields.travelDocumentType,
          travelDocumentNumber: fields.travelDocumentNumber,
          address: fields.address,
          emergencyContactName: fields.emergencyContactName,
          emergencyContactPhone: fields.emergencyContactPhone,
          emergencyContactRelationship: relationship,
          termsAccepted: accepted,
        },
      };
    });

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
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

  if (step === "cart") {
    const total = cart.reduce((sum, item) => sum + tierFor(item.passKey).priceCents, 0);

    return (
      <div className="register-card">
        <p className="register-step">Step 1 of 3</p>
        <h2>Choose your passes</h2>
        <p className="register-lede">
          Add one pass per traveller. Each pass gets its own tourist registration and Tokio Marine
          insurance details.
        </p>

        <div className="cart-tiers">
          {passTiers.map((tier) => (
            <div className="cart-tier-row" key={tier.key}>
              <div className="cart-tier-row-info">
                <strong>{tier.name}</strong>
                <span className="cart-tier-row-price">MYR {tier.price}</span>
              </div>
              <button type="button" className="button ghost dark" onClick={() => addToCart(tier.key)}>
                Add
              </button>
            </div>
          ))}
        </div>

        {cart.length === 0 ? (
          <p className="cart-empty">Your cart is empty — add a pass above to get started.</p>
        ) : (
          <ul className="cart-list">
            {cart.map((item, index) => (
              <li className="cart-list-item" key={item.id}>
                <span>
                  {index + 1}. {tierFor(item.passKey).name} Pass — MYR {tierFor(item.passKey).price}
                </span>
                <button
                  type="button"
                  className="cart-list-remove"
                  onClick={() => removeFromCart(item.id)}
                  aria-label="Remove"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        {cart.length > 0 && (
          <div className="cart-total">
            <span>Total ({cart.length} pass{cart.length > 1 ? "es" : ""})</span>
            <span>MYR {(total / 100).toFixed(2)}</span>
          </div>
        )}

        <div className="register-actions">
          <button type="button" className="button primary" onClick={startDetails} disabled={cart.length === 0}>
            Continue to registration
          </button>
        </div>
      </div>
    );
  }

  if (step === "details") {
    const item = cart[activeIndex];
    const tier = tierFor(item.passKey);
    const fields = fieldsFor(item.id);

    return (
      <form className="register-card" onSubmit={goToNextRegistrant}>
        <p className="register-step">Step 2 of 3</p>
        <h2>
          Registrant {activeIndex + 1} of {cart.length} — {tier.name} Pass
        </h2>
        <p className="register-lede">
          Please provide their details to help us ensure a smooth and personalised travel experience.
          We&apos;ll collect your email and phone number securely at payment.
        </p>

        <RegistrationFields fields={fields} set={(key, value) => setField(item.id, key, value)} />

        {error && (
          <p className="checkout-error" role="alert">
            {error}
          </p>
        )}

        <div className="register-actions">
          <button type="button" className="button ghost dark" onClick={goBackFromDetails}>
            Back
          </button>
          <button type="submit" className="button primary">
            {activeIndex < cart.length - 1 ? "Next registrant" : "Continue to Terms & Conditions"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="register-card" onSubmit={submit}>
      <p className="register-step">Step 3 of 3</p>
      <h2>Terms &amp; Conditions</h2>
      <p className="register-lede">
        Please read and accept the terms below to complete your purchase of {cart.length} pass
        {cart.length > 1 ? "es" : ""}.
      </p>

      <div className="terms-scroll">
        <InsuranceTerms />
      </div>

      <label className="register-consent">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          required
        />
        <span>
          I hereby confirm that I have read, understood and agreed to the Traveloop Terms &amp;
          Conditions and Insurance Terms &amp; Conditions on behalf of every registrant above. I
          acknowledge that participation is voluntary and at each participant&apos;s own risk. I
          understand that insurance coverage is subject to the insurer&apos;s policy terms, conditions,
          exclusions and final approval, and that Traveloop (Seni Mega Venture Sdn. Bhd.) shall not be
          liable for any claim rejected or reduced by the insurer.
        </span>
      </label>

      {error && (
        <p className="checkout-error" role="alert">
          {error}
        </p>
      )}

      <div className="register-actions">
        <button
          type="button"
          className="button ghost dark"
          onClick={() => {
            setActiveIndex(cart.length - 1);
            setStep("details");
          }}
          disabled={status === "redirecting"}
        >
          Back
        </button>
        <button
          type="submit"
          className="button primary"
          disabled={!accepted || status === "redirecting"}
          aria-busy={status === "redirecting"}
        >
          {status === "redirecting" ? (
            <>
              <span className="checkout-spinner" aria-hidden="true" />
              Redirecting…
            </>
          ) : (
            "Agree & continue to payment"
          )}
        </button>
      </div>
    </form>
  );
}

type RegistrationFieldsProps = {
  fields: Fields;
  set: <K extends keyof Fields>(key: K, value: Fields[K]) => void;
};

function RegistrationFields({ fields, set }: RegistrationFieldsProps) {
  return (
    <>
      <label className="admin-field">
        <span>Full name</span>
        <input
          type="text"
          value={fields.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          autoComplete="name"
          required
        />
      </label>

      <label className="admin-field">
        <span>Nationality</span>
        <select
          value={fields.nationality}
          onChange={(e) => set("nationality", e.target.value)}
          required
        >
          <option value="">Select nationality</option>
          {NATIONALITIES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      {fields.nationality === "Other" && (
        <label className="admin-field">
          <span>Please specify nationality</span>
          <input
            type="text"
            value={fields.otherNationality}
            onChange={(e) => set("otherNationality", e.target.value)}
            required
          />
        </label>
      )}

      <div className="register-row">
        <label className="admin-field">
          <span>Arrival date</span>
          <input
            type="date"
            value={fields.arrivalDate}
            onChange={(e) => set("arrivalDate", e.target.value)}
            required
          />
        </label>
        <label className="admin-field">
          <span>Departure date</span>
          <input
            type="date"
            value={fields.departureDate}
            onChange={(e) => set("departureDate", e.target.value)}
            min={fields.arrivalDate || undefined}
            required
          />
        </label>
      </div>

      <label className="admin-field">
        <span>Type of travel document</span>
        <select
          value={fields.travelDocumentType}
          onChange={(e) => set("travelDocumentType", e.target.value)}
          required
        >
          <option value="">Select a document type</option>
          {DOCUMENT_TYPES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <label className="admin-field">
        <span>Document number</span>
        <input
          type="text"
          value={fields.travelDocumentNumber}
          onChange={(e) => set("travelDocumentNumber", e.target.value)}
          required
        />
      </label>

      <label className="admin-field">
        <span>Address</span>
        <textarea
          rows={3}
          value={fields.address}
          onChange={(e) => set("address", e.target.value)}
          required
        />
      </label>

      <p className="register-section-label">Emergency contact (optional)</p>

      <label className="admin-field">
        <span>Emergency contact name</span>
        <input
          type="text"
          value={fields.emergencyContactName}
          onChange={(e) => set("emergencyContactName", e.target.value)}
        />
      </label>

      <label className="admin-field">
        <span>Emergency contact phone number</span>
        <input
          type="tel"
          value={fields.emergencyContactPhone}
          onChange={(e) => set("emergencyContactPhone", e.target.value)}
        />
      </label>

      <label className="admin-field">
        <span>Relationship to emergency contact</span>
        <select
          value={fields.emergencyContactRelationship}
          onChange={(e) => set("emergencyContactRelationship", e.target.value)}
        >
          <option value="">Select a relationship</option>
          {EMERGENCY_RELATIONSHIPS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      {fields.emergencyContactRelationship === "Other" && (
        <label className="admin-field">
          <span>Please specify the relationship</span>
          <input
            type="text"
            value={fields.otherRelationship}
            onChange={(e) => set("otherRelationship", e.target.value)}
          />
        </label>
      )}
    </>
  );
}

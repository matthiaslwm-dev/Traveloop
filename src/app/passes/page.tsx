"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Icon } from "../components/Icons";
import PassCard, { PassStack } from "../components/PassCard";
import CheckoutCancelledNotice from "../components/CheckoutCancelledNotice";
import { passTiers, passComparison, type PassKey } from "../data/passes";

const tierKeys: PassKey[] = ["silver", "gold", "platinum"];

const safetyFeatures = [
  {
    icon: "headset",
    title: "24/7 Emergency Helpline",
    body: "Get immediate assistance when you need it most. Our dedicated support line connects you directly to local emergency services to ensure you are never stranded.",
  },
  {
    icon: "shield",
    title: "Embassy and Consular Support",
    body: "Travel with the confidence that help is a phone call away. We provide direct access to your home country's embassies and consulates should you need official assistance.",
  },
  {
    icon: "handshake",
    title: "Medical and Police Coordination",
    body: "In the event of a crisis, we bridge the gap between you and local authorities or hospitals, guiding you through the process until you are safe and secure.",
  },
];

const passFaqs = [
  {
    question: "How do I redeem my pass perks?",
    answer:
      "Book each cultural experience (Lion Dance, Batik Painting, Indian Culture) during checkout, then show your pass confirmation at partner locations to redeem retail and food & beverage deals.",
  },
  {
    question: "What does the included travel insurance cover?",
    answer:
      "Gold and Platinum passes include Group Personal Accident Insurance underwritten by Tokio Marine Insurans (Malaysia) Berhad — up to MYR 50,000 for accidental death or permanent disablement, and up to MYR 500 for accidental medical expenses, for registered participants aged 30 days to 75 years while in Malaysia.",
  },
  {
    question: "How do I make an insurance claim?",
    answer:
      "Notify our team within 5 days of the incident via insurance@traveloop.my or WhatsApp +6011-3949 2888, with a completed claim form, medical report, original receipts, and a copy of your ID.",
  },
  {
    question: "Is Traveloop Card a travel insurance policy?",
    answer:
      "No. The Traveloop Card includes Personal Accident and Personal Accident Medical Expense benefits provided through our insurance partner, subject to applicable terms and conditions.",
  },
  {
    question: "Can children join the cultural experiences?",
    answer:
      "Yes — children aged 4 or 5 and under (depending on the experience) join free alongside a paying adult.",
  },
  {
    question: "How far ahead do I need to book the Platinum photography session?",
    answer:
      "At least 3 days in advance, subject to photographer and time-slot availability. Sessions run daily at 8:00 AM, 10:00 AM, 2:00 PM, and 4:00 PM around Penang's Heritage Zone and Batu Ferringhi hotels.",
  },
];

export default function PassesPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [view, setView] = useState<"cards" | "table">("cards");

  return (
    <>
      <Navbar forceScrolled />
      <main>
        <section className="passes-hero">
          <div className="passes-hero-glow" aria-hidden="true" />
          <div className="passes-hero-inner">
            <div className="passes-hero-copy">
              <p className="eyebrow light">Passes</p>
              <h1>
                Choose your
                <br />
                <em>Malaysia pass.</em>
              </h1>
              <p className="passes-hero-lede">
                One pass unlocks retail deals, food &amp; beverage privileges,
                and exclusive cultural experiences across Malaysia — pick the
                tier that fits your trip.
              </p>
              <a className="button primary passes-hero-cta" href="#pricing">
                See all three passes
              </a>
            </div>

            <PassStack />
          </div>
        </section>

        <section className="passes-section section-light" id="pricing">
          <div className="section-heading centered">
            <p className="eyebrow">Pricing</p>
            <h2>
              Three tiers.
              <br />
              <em>One unforgettable trip.</em>
            </h2>
          </div>

          <Suspense fallback={null}>
            <CheckoutCancelledNotice />
          </Suspense>

          <div className="view-toggle" role="group" aria-label="Pricing view">
            <button
              type="button"
              className={`view-toggle-btn${view === "cards" ? " active" : ""}`}
              aria-pressed={view === "cards"}
              onClick={() => setView("cards")}
            >
              <Icon name="grid" />
              Card view
            </button>
            <button
              type="button"
              className={`view-toggle-btn${view === "table" ? " active" : ""}`}
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
            >
              <Icon name="table" />
              Compare perks
            </button>
          </div>

          {view === "cards" ? (
          <div className="pricing-grid">
            {passTiers.map((tier) => (
              <div
                className={`pricing-card accent-${tier.key}${tier.badge ? " popular" : ""}`}
                key={tier.key}
              >
                {tier.badge && <span className="pricing-badge">{tier.badge}</span>}
                <div className="pricing-visual">
                  <PassCard tierKey={tier.key} name={tier.name} />
                </div>
                <h3 className="pricing-name">{tier.name} Pass</h3>
                <p className="pricing-tagline">
                  {tier.tagline} {tier.sub}
                </p>
                <div className="tier-price">
                  <s className="tier-price-original">
                    <small>MYR</small>
                    {tier.originalPrice}
                  </s>
                  <strong className="tier-price-current">
                    <small>MYR</small>
                    {tier.price}
                  </strong>
                </div>
                <span className="tier-discount-badge">Exclusive 50% launch discount applied!</span>
                <ul className="tier-perks-list">
                  {tier.highlights.map((h) => (
                    <li key={h}>
                      <span className="tier-perk-icon">✓</span>
                      {h}
                    </li>
                  ))}
                </ul>
                <Link className="button primary" href={`/passes/register?pass=${tier.key}`}>
                  Choose {tier.name}
                </Link>
              </div>
            ))}
          </div>
          ) : (
          <div className="compare-wrap">
            <div className="compare-scroll">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Perk</th>
                    {passTiers.map((t) => (
                      <th key={t.key}>
                        <span className={`compare-swatch swatch-${t.key}`} aria-hidden="true" />
                        {t.name}
                        {t.badge && <span className="compare-badge">{t.badge}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {passComparison.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      {tierKeys.map((key) => {
                        const value = row.values[key];
                        return (
                          <td
                            key={key}
                            className={value ? "compare-cell-yes" : "compare-cell-no"}
                          >
                            {typeof value === "string" ? value : value ? "✓" : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="compare-cta-row">
                    <td />
                    {passTiers.map((t) => (
                      <td key={t.key}>
                        <Link className="compare-cta" href={`/passes/register?pass=${t.key}`}>
                          Choose {t.name}
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          )}
        </section>

        <section className="passes-section safety-section">
          <div className="safety-inner">
            <div className="safety-copy">
              <h2>
                Your Safety,
                <br />
                <em>Our Priority</em>
              </h2>
              <p>
                We do more than just save you money; we provide comprehensive
                peace of mind. With the Traveloop card, you gain a reliable
                partner ready to assist you during any travel emergency in
                Malaysia.
              </p>
            </div>

            <div className="safety-cards">
              {safetyFeatures.map((s) => (
                <div className="safety-card" key={s.title}>
                  <span className="safety-card-icon">
                    <Icon name={s.icon} />
                  </span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="passes-section section-cream passes-faq">
          <div className="section-heading centered">
            <p className="eyebrow">FAQ</p>
            <h2>
              Questions about
              <br />
              <em>your pass.</em>
            </h2>
          </div>
          <div className="accordion passes-faq-accordion">
            {passFaqs.map((item) => {
              const isOpen = openFaq === item.question;
              return (
                <div className={`accordion-row${isOpen ? " open" : ""}`} key={item.question}>
                  <button
                    type="button"
                    className="accordion-head"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : item.question)}
                  >
                    <span className="accordion-title">{item.question}</span>
                    <span className="accordion-chevron">⌄</span>
                  </button>
                  {isOpen && <p className="accordion-body">{item.answer}</p>}
                </div>
              );
            })}
          </div>
        </section>

        <section className="passes-closing">
          <div className="passes-closing-card">
            <p className="eyebrow light">Ready when you are</p>
            <h3>Get your Traveloop Pass today.</h3>
            <p>
              Have a question before you choose a tier? Our team can help you
              pick the right pass for your trip.
            </p>
            <div className="passes-closing-actions">
              <Link className="button primary" href="/contact">
                Talk to us
              </Link>
              <a
                className="button ghost"
                href="https://wa.me/60123456789"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp us
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Icon, StarbucksLogo } from "../components/Icons";
import { partners, partnerCategories, type PartnerCategory } from "../data/partners";

const filters: Array<PartnerCategory | "All"> = ["All", ...partnerCategories];

export default function PartnersPage() {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");

  const filteredPartners = useMemo(
    () =>
      activeFilter === "All"
        ? partners
        : partners.filter((p) => p.category === activeFilter),
    [activeFilter]
  );

  return (
    <>
      <Navbar forceScrolled />
      <main>
        <section className="arrival section-light page-hero">
          <div className="section-heading centered">
            <h2>Our Trusted Partners</h2>
            <p>
              The brands and places where your Traveloop pass unlocks
              exclusive perks.
            </p>
          </div>
        </section>

        <section className="section-light" style={{ paddingBottom: "clamp(90px,10vw,150px)" }}>
          <div className="pill-filter">
            {filters.map((f) => (
              <button
                type="button"
                key={f}
                className={`pill-filter-btn${activeFilter === f ? " active" : ""}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="partner-directory-grid">
            {filteredPartners.length === 0 ? (
              <p className="partner-directory-empty">
                No partners in this category yet — check back soon.
              </p>
            ) : (
              filteredPartners.map((p) => (
                <article className="partner-directory-card" key={p.name}>
                  <div className="partner-directory-top">
                    <span className="partner-directory-icon">
                      {p.logo === "starbucks" ? <StarbucksLogo /> : <Icon name={p.icon!} />}
                    </span>
                    <span className="partner-directory-category">{p.category}</span>
                  </div>
                  <strong className="partner-directory-name">{p.name}</strong>
                  {p.location && (
                    <span className="partner-directory-location">
                      <Icon name="pin" />
                      {p.location}
                    </span>
                  )}
                  <span className="partner-directory-deal">{p.deal}</span>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="closing section-dark">
          <div
            className="closing-bg"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2200&q=88')",
            }}
          />
          <div className="closing-overlay" />
          <div className="closing-content">
            <h2>Want to partner with us?</h2>
            <p className="closing-copy">
              We&apos;re always looking for local businesses that want to
              welcome more travellers through their doors. Get in touch and
              let&apos;s talk.
            </p>
            <Link className="button primary" href="/contact">
              Become a Partner
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

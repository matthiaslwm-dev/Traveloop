"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Icon({ name }: { name: string }) {
  const svgProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  const paths: Record<string, ReactNode> = {
    mail: (
      <>
        <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M3.5 6.5 12 13l8.5-6.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
        <circle cx="12" cy="10" r="2.6" />
      </>
    ),
  };
  return <svg {...svgProps}>{paths[name]}</svg>;
}

const subjects = [
  "General enquiry",
  "Pass & pricing",
  "Partner with us",
  "Booking support",
] as const;

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<(typeof subjects)[number]>(subjects[0]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const pass = new URLSearchParams(window.location.search).get("pass");
    if (!pass) return;
    setSubject("Pass & pricing");
    setMessage(
      `Hi, I'm interested in the ${pass} Pass. Could you tell me more about how to purchase it?`
    );
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name || !email || !message) return;
    setStatus("sending");
    setTimeout(() => setStatus("sent"), 900);
  }

  return (
    <>
      <Navbar forceScrolled />
      <main>
        <section className="arrival section-light contact-hero">
          <div className="section-heading centered">
            <p className="eyebrow">Contact Us</p>
            <h2>
              We&apos;d love to
              <br />
              <em>hear from you.</em>
            </h2>
            <p>
              Questions about your Traveloop Pass, a partner enquiry, or need
              help planning your trip? Reach out and our team will get back to
              you shortly.
            </p>
          </div>

          <div className="contact-panel">
            <div className="contact-grid">
              <div className="contact-info">
                <a
                  className="contact-card"
                  href="https://wa.me/60123456789"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="contact-card-icon whatsapp">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </span>
                  <span className="contact-card-body">
                    <strong>Chat on WhatsApp</strong>
                    <span>+60 12-345 6789</span>
                  </span>
                </a>

                <a className="contact-card" href="mailto:hello@traveloop.my">
                  <span className="contact-card-icon">
                    <Icon name="mail" />
                  </span>
                  <span className="contact-card-body">
                    <strong>Email us</strong>
                    <span>hello@traveloop.my</span>
                  </span>
                </a>

                <div className="contact-card static">
                  <span className="contact-card-icon">
                    <Icon name="clock" />
                  </span>
                  <span className="contact-card-body">
                    <strong>Response time</strong>
                    <span>We reply within 1 business day</span>
                  </span>
                </div>

                <div className="contact-card static">
                  <span className="contact-card-icon">
                    <Icon name="pin" />
                  </span>
                  <span className="contact-card-body">
                    <strong>Based in</strong>
                    <span>Kuala Lumpur, Malaysia</span>
                  </span>
                </div>

                <p className="contact-info-note">
                  Prefer to talk it through? Message us on WhatsApp for the
                  fastest response, Monday to Friday, 9am–6pm MYT.
                </p>
              </div>

              <form className="contact-form" onSubmit={handleSubmit}>
                {status === "sent" ? (
                  <div className="contact-form-success">
                    <span className="contact-form-success-icon">✓</span>
                    <strong>Message sent!</strong>
                    <p>Thanks for reaching out — our team will get back to you soon.</p>
                  </div>
                ) : (
                  <>
                    <div className="form-row">
                      <label className="form-field">
                        <span>Name</span>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          required
                        />
                      </label>
                      <label className="form-field">
                        <span>Email</span>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                        />
                      </label>
                    </div>

                    <label className="form-field">
                      <span>Subject</span>
                      <select
                        value={subject}
                        onChange={(e) =>
                          setSubject(e.target.value as (typeof subjects)[number])
                        }
                      >
                        {subjects.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="form-field">
                      <span>Message</span>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="How can we help?"
                        rows={5}
                        required
                      />
                    </label>

                    <button
                      type="submit"
                      className="button primary contact-submit"
                      disabled={status === "sending"}
                    >
                      {status === "sending" ? "Sending…" : "Send Message"}
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

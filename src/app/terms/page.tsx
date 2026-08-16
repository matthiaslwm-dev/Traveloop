import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms and conditions, health, refund, cancellation, payment and billing policies that apply to Traveloop services.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "16 August 2026";

const sections = [
  { id: "website-terms", label: "1. Website Terms and Conditions" },
  { id: "health", label: "2. Health and Appointment Policy" },
  { id: "refunds", label: "3. Refund and Cancellation Policy" },
  { id: "payments", label: "4. Payment and Billing Policy" },
];

export default function TermsPage() {
  return (
    <>
      <Navbar forceScrolled />
      <main id="main">
        <section className="arrival section-light page-hero">
          <div className="section-heading centered">
            <p className="eyebrow">Legal</p>
            <h2>
              Terms of
              <br />
              <em>Service.</em>
            </h2>
            <p>
              Welcome to Traveloop. By accessing or using our website, you agree
              to the following terms and conditions. Please read them carefully
              before using our services.
            </p>
            <p className="legal-updated">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        <section className="section-light legal-section">
          <div className="legal-layout">
            <aside className="legal-toc" aria-label="On this page">
              <p className="legal-toc-title">On this page</p>
              <ol>
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`}>{s.label}</a>
                  </li>
                ))}
              </ol>
            </aside>

            <div className="legal-body">
              <section id="website-terms" className="legal-block">
                <h2>1. Website Terms and Conditions</h2>
                <p>
                  Welcome to the Traveloop website. By accessing or using this
                  website, you agree to comply with and be bound by these Terms
                  and Conditions. If you do not agree with these Terms, you must
                  discontinue use of the website immediately. These Terms are
                  governed by the laws of Malaysia.
                </p>

                <h3>Company information</h3>
                <dl className="legal-details">
                  <div>
                    <dt>Website owner</dt>
                    <dd>
                      Seni Mega Venture Sdn Bhd, registered with the Companies
                      Commission of Malaysia
                    </dd>
                  </div>
                  <div>
                    <dt>Business address</dt>
                    <dd>
                      50, Jalan Khaw Sim Bee, 10400 Pulau Pinang, Malaysia
                    </dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>
                      <a href="mailto:traveloop@3d-group.com.my">
                        traveloop@3d-group.com.my
                      </a>
                    </dd>
                  </div>
                </dl>

                <h3>Services</h3>
                <p>
                  Traveloop provides tourism-related services, including but not
                  limited to travel passes, curated local experiences, tourist
                  SIM cards, travel insurance and related travel products.
                </p>

                <h3>Website usage</h3>
                <p>Users agree that they will not:</p>
                <ul className="legal-list">
                  <li>Use the website for unlawful purposes</li>
                  <li>Attempt to gain unauthorized access to website systems</li>
                  <li>Transmit harmful software or malicious code</li>
                  <li>Engage in fraudulent transactions</li>
                </ul>
                <p>
                  Traveloop reserves the right to restrict or terminate access to
                  users who violate these terms.
                </p>

                <h3>Intellectual property</h3>
                <p>All content on the website, including:</p>
                <ul className="legal-list">
                  <li>Logos</li>
                  <li>Graphics</li>
                  <li>Text</li>
                  <li>Images</li>
                  <li>Software</li>
                </ul>
                <p>
                  is the intellectual property of Traveloop unless otherwise
                  stated. Users may not reproduce, distribute, or modify any
                  website content without written permission.
                </p>

                <h3>Pricing and payments</h3>
                <p>All prices listed on the website:</p>
                <ul className="legal-list">
                  <li>
                    Are displayed in Malaysian Ringgit (MYR), unless otherwise
                    stated. Prices may change without prior notice due to
                    exchange rates
                  </li>
                  <li>Include applicable taxes where required</li>
                </ul>
                <p>
                  Payments are processed securely through third-party payment
                  processors including Stripe. Traveloop does not store customer
                  payment card information.
                </p>

                <h3>Limitation of liability</h3>
                <p>Traveloop shall not be liable for:</p>
                <ul className="legal-list">
                  <li>Travel disruptions beyond its control</li>
                  <li>Third-party service failures</li>
                  <li>Losses caused by inaccurate user information</li>
                </ul>
                <p>
                  Users agree that they use the website at their own risk.
                </p>

                <h3>Third-party services</h3>
                <p>
                  Certain services offered through the website may involve
                  third-party providers such as:
                </p>
                <ul className="legal-list">
                  <li>Insurance companies</li>
                  <li>Telecommunications providers</li>
                  <li>Tourism partners</li>
                </ul>
                <p>
                  Traveloop is not responsible for the policies or actions of
                  third-party providers.
                </p>

                <h3>Governing law</h3>
                <p>
                  These Terms shall be governed by the laws of Malaysia,
                  including the:
                </p>
                <ul className="legal-list">
                  <li>Consumer Protection Act 1999</li>
                  <li>Electronic Commerce Act 2006</li>
                </ul>
              </section>

              <section id="health" className="legal-block">
                <h2>2. Health and Appointment Policy</h2>
                <p>
                  At Traveloop, we prioritise the health, safety, and well-being
                  of all our clients and staff. To maintain a safe and
                  responsible environment, the following policy applies:
                </p>
                <ol className="legal-list numbered">
                  <li>
                    <strong>Health disclosure requirement.</strong> Any client
                    who has been diagnosed with any form of illness or medical
                    condition is required to take appropriate action regarding
                    their booking or appointment.
                  </li>
                  <li>
                    <strong>Cancellation or rescheduling.</strong> Clients who
                    receive a diagnosis after making a booking must cancel or
                    reschedule their appointment immediately. Clients who are
                    aware of a medical condition before making a booking must
                    refrain from proceeding with the booking until they have
                    fully recovered or have received appropriate medical
                    clearance.
                  </li>
                  <li>
                    <strong>Resumption of services.</strong> Clients may proceed
                    with booking or attending appointments only after they have
                    been properly treated and are medically fit, where
                    applicable.
                  </li>
                  <li>
                    <strong>Responsibility and compliance.</strong> It is the
                    responsibility of each client to comply with this policy in
                    order to ensure a safe experience for everyone. Traveloop
                    reserves the right to refuse or postpone services if a
                    client appears unwell or fails to adhere to this policy.
                  </li>
                </ol>
              </section>

              <section id="refunds" className="legal-block">
                <h2>3. Refund and Cancellation Policy</h2>

                <h3>Overview</h3>
                <p>
                  Traveloop aims to provide a fair and transparent refund policy
                  for all tourism services purchased through the website.
                </p>

                <h3>Cancellation by customer</h3>
                <p>
                  Customers may cancel bookings for personal reasons, but no
                  refund is available for any cancellation after payment.
                </p>

                <h3>Non-refundable items</h3>
                <p>The following items may not be refundable:</p>
                <ul className="legal-list">
                  <li>Activated tourist SIM cards</li>
                  <li>Digital vouchers already used</li>
                  <li>Completed tourism experiences</li>
                  <li>Insurance policies once issued</li>
                </ul>

                <h3>Cancellation by Traveloop</h3>
                <p>Traveloop may cancel services due to:</p>
                <ul className="legal-list">
                  <li>Weather conditions</li>
                  <li>Safety concerns</li>
                  <li>Operational issues</li>
                </ul>
                <p>If this occurs, customers will receive either:</p>
                <ul className="legal-list">
                  <li>A full refund</li>
                  <li>A rescheduling option</li>
                  <li>An alternative service of equal value</li>
                </ul>

                <h3>Refund processing</h3>
                <p>
                  Approved refunds will be processed through the original payment
                  method used during purchase. Payment processors such as Stripe
                  may take 5&ndash;10 business days to complete the refund.
                </p>

                <h3>Chargebacks</h3>
                <p>
                  Customers are encouraged to contact Traveloop support before
                  initiating payment disputes with their bank or card provider.
                  Fraudulent chargebacks may result in account suspension.
                </p>
              </section>

              <section id="payments" className="legal-block">
                <h2>4. Payment and Billing Policy</h2>

                <h3>Accepted payment methods</h3>
                <p>
                  Traveloop accepts payments through secure payment systems
                  including:
                </p>
                <ul className="legal-list">
                  <li>Credit cards</li>
                  <li>Debit cards</li>
                  <li>International card payments</li>
                </ul>
                <p>Payments are processed through Stripe.</p>

                <h3>Currency</h3>
                <p>
                  All transactions are processed in Malaysian Ringgit (MYR).
                  International customers may be charged currency conversion fees
                  by their banks.
                </p>

                <h3>Payment security</h3>
                <p>
                  Traveloop uses industry-standard security protocols including:
                </p>
                <ul className="legal-list">
                  <li>SSL encryption</li>
                  <li>Secure payment gateways</li>
                  <li>Fraud detection systems</li>
                </ul>
                <p>
                  Sensitive payment information is handled exclusively by the
                  payment processor and is not stored on the website.
                </p>

                <h3>Billing information</h3>
                <p>
                  Customers must provide accurate billing information including:
                </p>
                <ul className="legal-list">
                  <li>Full name</li>
                  <li>Billing address</li>
                  <li>Email address</li>
                  <li>Contact phone number</li>
                </ul>
                <p>
                  Incorrect billing details may cause payment or refund failure.
                </p>

                <h3>Transaction confirmation</h3>
                <p>After successful payment, customers will receive:</p>
                <ul className="legal-list">
                  <li>An email confirmation</li>
                  <li>Booking details</li>
                  <li>A receipt or invoice</li>
                </ul>

                <h3>Fraud prevention</h3>
                <p>Traveloop reserves the right to:</p>
                <ul className="legal-list">
                  <li>Verify suspicious transactions</li>
                  <li>Request additional identification</li>
                  <li>Cancel fraudulent bookings</li>
                </ul>

                <h3>Taxes</h3>
                <p>
                  Where applicable, transactions may include taxes required by
                  Malaysian law. This includes potential obligations under the
                  sales and service tax.
                </p>
              </section>

              <div className="legal-contact">
                <h3>Questions about these terms?</h3>
                <p>
                  Contact us at{" "}
                  <a href="mailto:traveloop@3d-group.com.my">
                    traveloop@3d-group.com.my
                  </a>{" "}
                  or call <a href="tel:+601139492888">+6011-3949-2888</a>.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

import Link from "next/link";
import { Icon } from "./Icons";

export default function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <div className="footer-brand">
          <img src="/traveloop-logo.webp" alt="Traveloop" />
          <p>Experience Malaysia like never before.</p>
          <div className="footer-links">
            <span
              className="footer-link-placeholder"
              title="Instagram — coming soon"
              aria-label="Instagram"
            >
              <Icon name="instagram" />
            </span>
            <span
              className="footer-link-placeholder"
              title="TikTok — coming soon"
              aria-label="TikTok"
            >
              <Icon name="tiktok" />
            </span>
          </div>
        </div>

        <div className="footer-col">
          <h4>Get in touch</h4>
          <address className="footer-contact">
            <span className="footer-contact-row">
              <span className="footer-contact-icon">
                <Icon name="pin" />
              </span>
              <span>
                50, Jalan Khaw Sim Bee, 10400, Georgetown,
                <br />
                Pulau Pinang, Malaysia
              </span>
            </span>
            <a className="footer-contact-row" href="tel:+60113949288">
              <span className="footer-contact-icon">
                <Icon name="phone" />
              </span>
              <span>+6011-3949-2888</span>
            </a>
            <a
              className="footer-contact-row"
              href="mailto:partnership@traveloop.my"
            >
              <span className="footer-contact-icon">
                <Icon name="mail" />
              </span>
              <span>partnership@traveloop.my</span>
            </a>
          </address>
        </div>

        <div className="footer-col">
          <h4>Legal</h4>
          <div className="footer-legal-links">
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
          <p className="footer-license">
            MOTAC License: Malaysia Tours &amp; Travel Agency Sdn Bhd.
            <br />
            No Siri: P00266 / No. License: 0584
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <small>Copyright &copy; 2026 Traveloop. All Rights Reserved.</small>
      </div>
    </footer>
  );
}

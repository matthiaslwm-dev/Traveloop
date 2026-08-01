import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <img src="/traveloop-logo.webp" alt="Traveloop" />
      <p>Experience Malaysia like never before.</p>
      <div className="footer-links">
        <span className="footer-link-placeholder" title="Coming soon">
          Instagram
        </span>
        <span className="footer-link-placeholder" title="Coming soon">
          TikTok
        </span>
        <Link href="/contact">Contact</Link>
      </div>
      <small>
        Concept prototype · Images are placeholders for design exploration
        only.
      </small>
    </footer>
  );
}

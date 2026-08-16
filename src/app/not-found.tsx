import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <Navbar forceScrolled />
      <main id="main">
        <section className="arrival section-light page-hero">
          <div className="section-heading centered">
            <p className="eyebrow">404</p>
            <h1>
              This page took
              <br />
              <em>a wrong turn.</em>
            </h1>
            <p>
              The page you were looking for doesn&apos;t exist — or it has moved.
              Here&apos;s where most travellers go next.
            </p>
          </div>
          <div className="notfound-actions">
            <Link className="button primary" href="/passes">
              View the passes
            </Link>
            <Link className="button ghost dark" href="/">
              Back to home
            </Link>
            <Link className="button ghost dark" href="/contact">
              Contact us
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

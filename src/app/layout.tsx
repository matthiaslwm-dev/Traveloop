import type { Metadata } from "next";
import { DM_Sans, Playfair_Display, Sora } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600"],
  style: ["normal", "italic"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const SITE_DESCRIPTION =
  "Traveloop is a Malaysian tourist pass that bundles retail and dining deals, " +
  "guided cultural experiences (lion dance, batik painting, Indian heritage) and " +
  "Tokio Marine personal accident cover into one card. Based in Penang, Malaysia.";

export const metadata: Metadata = {
  metadataBase: new URL("https://traveloop.my"),
  // Per-page titles fill the "%s" slot; the homepage overrides with `absolute`.
  title: {
    default: "Traveloop — The Tourist Pass for Malaysia",
    template: "%s — Traveloop",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Traveloop",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Traveloop",
    locale: "en_MY",
    url: "/",
    title: "Traveloop — The Tourist Pass for Malaysia",
    description: SITE_DESCRIPTION,
    images: ["/hero3.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Traveloop — The Tourist Pass for Malaysia",
    description: SITE_DESCRIPTION,
    images: ["/hero3.png"],
  },
  robots: { index: true, follow: true },
};

/**
 * Entity facts for AI assistants and search engines: who Traveloop is, where
 * it operates, and what it sells. Kept in the root layout so it appears on
 * every page rather than only the homepage.
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "@id": "https://traveloop.my/#organization",
  name: "Traveloop",
  description: SITE_DESCRIPTION,
  url: "https://traveloop.my",
  logo: "https://traveloop.my/traveloop-logo.webp",
  email: "partnership@traveloop.my",
  telephone: "+601139492888",
  areaServed: { "@type": "Country", name: "Malaysia" },
  address: {
    "@type": "PostalAddress",
    streetAddress: "50, Jalan Khaw Sim Bee",
    addressLocality: "Georgetown",
    postalCode: "10400",
    addressRegion: "Pulau Pinang",
    addressCountry: "MY",
  },
  foundingDate: "2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} ${playfairDisplay.variable} ${sora.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}

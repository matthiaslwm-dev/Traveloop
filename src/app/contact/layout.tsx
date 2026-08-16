import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Questions about a Traveloop Pass, a booking, or partnering with us? Message the Traveloop team in Penang, Malaysia — we reply within one business day.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Traveloop",
    description:
      "Questions about a Traveloop Pass, a booking, or a partnership? We reply within one business day.",
    url: "/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

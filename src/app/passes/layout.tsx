import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tourist Passes & Pricing",
  description:
    "Compare the Silver, Gold and Platinum Traveloop Passes: retail and dining deals worth up to MYR 18,000, discounted cultural experiences, and Tokio Marine personal accident cover. From MYR 39.90.",
  alternates: { canonical: "/passes" },
  openGraph: {
    title: "Tourist Passes & Pricing",
    description:
      "Silver, Gold and Platinum tourist passes for Malaysia. Retail and dining deals, cultural experiences, and personal accident cover from MYR 39.90.",
    url: "/passes",
  },
};

export default function PassesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

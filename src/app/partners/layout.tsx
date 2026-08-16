import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner Deals & Discounts in Malaysia",
  description:
    "Every brand, restaurant and attraction where a Traveloop Pass unlocks a discount — dining, shopping, experiences and wellness partners across Penang and Kuala Lumpur.",
  alternates: { canonical: "/partners" },
  openGraph: {
    title: "Partner Deals & Discounts in Malaysia",
    description:
      "Every brand, restaurant and attraction where a Traveloop Pass unlocks a discount across Malaysia.",
    url: "/partners",
  },
};

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return children;
}

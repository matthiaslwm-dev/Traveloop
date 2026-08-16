import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Traveloop connects travellers in Malaysia with vetted local partners and authentic cultural experiences. Learn who we are, why we started, and what we stand for.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Us",
    description:
      "Traveloop connects travellers in Malaysia with vetted local partners and authentic cultural experiences.",
    url: "/about",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
